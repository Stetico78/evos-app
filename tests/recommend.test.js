const test = require('node:test');
const assert = require('node:assert/strict');
const recommend = require('../api/recommend');

function request(body) {
  return new Promise((resolve) => {
    const response = {
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(statusCode) { this.statusCode = statusCode; return this; },
      json(payload) { resolve({ statusCode: this.statusCode, payload, headers: this.headers }); }
    };
    recommend({ method: 'POST', body }, response);
  });
}

test('recommendation endpoint always returns useful, validated content', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  try {
    delete process.env.GEMINI_API_KEY;
    const local = await request({
      scores: { body: 72, mind: 54, emotion: 31, relationships: 68, purpose: 63 },
      goal: 'recuperar estabilidad'
    });
    assert.equal(local.statusCode, 200);
    assert.equal(local.payload.mode, 'fallback');
    assert.match(local.payload.title, /emoción/i);
    assert.match(local.payload.recommendation, /recuperar estabilidad/i);
    assert.ok(local.payload.next_action.length > 20);

    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"title":"","recommendation":"","next_action":"","priority":3}' }] } }]
      })
    });
    const emptyAI = await request({ scores: { body: 45, mind: 60, emotion: 70, relationships: 80, purpose: 90 } });
    assert.equal(emptyAI.statusCode, 200);
    assert.equal(emptyAI.payload.mode, 'fallback');
    assert.match(emptyAI.payload.title, /cuerpo/i);
    assert.ok(emptyAI.payload.recommendation.length > 40);

    const invalid = await request({ scores: { body: 900 } });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.payload.ok, false);
  } finally {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    global.fetch = originalFetch;
  }
});
