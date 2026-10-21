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
