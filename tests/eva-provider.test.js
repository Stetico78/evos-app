const test = require('node:test');
const assert = require('node:assert/strict');
const {callEvaModel} = require('../lib/eva-provider.cjs');

test('uses the configured OpenAI account and preserves structured updates', async () => {
  const response = await callEvaModel('Un sofá de Alzira a Carcaixent', [], {}, {
    env: {OPENAI_API_KEY: 'test-key'},
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.response_format.type, 'json_object');
      return {ok: true, json: async () => ({choices:[{message:{content:JSON.stringify({reply:'¿En qué calle lo recogemos?', updates:{origin:{city:'Alzira'},destination:{city:'Carcaixent'},load:{itemTypes:['sofá'],itemCount:1}},nextQuestion:{field:'origin_full_address',text:'¿En qué calle lo recogemos?'},rejected:[]})}}]})};
    },
  });
  assert.equal(response.updates.origin.city, 'Alzira');
  assert.equal(response.updates.load.itemTypes[0], 'sofá');
});

test('returns a safe unavailable error when the provider rejects the key', async () => {
  await assert.rejects(callEvaModel('Hola', [], {}, {env:{OPENAI_API_KEY:'test'},fetch:async()=>({ok:false,status:401})}), /EVA_PROVIDER_401/);
});

test('rejects malformed provider output instead of fabricating a conversation', async () => {
  await assert.rejects(callEvaModel('Hola', [], {}, {env:{OPENAI_API_KEY:'test'},fetch:async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"updates": []}'}}]})})}), /EVA_INVALID_RESPONSE/);
});

test('tries the existing Gemini account when OpenAI quota is exhausted', async () => {
  let requests=0;
  const result=await callEvaModel('Un sofá',[],{}, {env:{OPENAI_API_KEY:'openai-test',GEMINI_API_KEY:'gemini-test'},fetch:async(url,options)=>{
    requests++;
    if(requests===1)return {ok:false,status:429,json:async()=>({error:{code:'insufficient_quota'}})};
    assert.match(url,/generativelanguage.googleapis.com/);
    assert.equal(options.headers['x-goog-api-key'],'gemini-test');
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({reply:'¿Dónde recogemos el sofá?',updates:{load:{itemTypes:['sofá']},route:{status:'verified'}}})}]}}]})};
  }});
  assert.equal(requests,2);
  assert.equal(result.reply,'¿Dónde recogemos el sofá?');
  assert.equal(result.updates.route,undefined);
});

test('recovers one transient Gemini failure with one bounded retry',async()=>{
 let calls=0,delays=[];
 const result=await callEvaModel('Montar un armario',[],{}, {env:{GEMINI_API_KEY:'test',EVA_PROVIDER:'gemini',EVA_GEMINI_MODEL:'gemini-3.8-flash'},sleep:async ms=>delays.push(ms),fetch:async()=>{
  calls++;
  if(calls===1)return{ok:false,status:503,json:async()=>({error:{status:'UNAVAILABLE'}})};
  return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({reply:'¿En qué localidad se hará el montaje?',updates:{serviceType:'assembly_only'}})}]}}]})};
 }});
 assert.equal(result.updates.serviceType,'assembly_only');assert.equal(calls,2);assert.equal(delays.length,1);assert.ok(delays[0]>=500&&delays[0]<=1500);
});

test('does not loop or retry exhausted quota',async()=>{
 let calls=0;
 await assert.rejects(callEvaModel('Hola',[],{}, {env:{GEMINI_API_KEY:'test',EVA_PROVIDER:'gemini'},fetch:async()=>{calls++;return{ok:false,status:429,json:async()=>({error:{status:'RESOURCE_EXHAUSTED'}})};}}),/EVA_GEMINI_QUOTA_EXHAUSTED/);
 assert.equal(calls,1);
});
