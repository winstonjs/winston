const http = require('http');
const Http = require('../../../../lib/winston/transports/http');

describe('HTTP transport queries', () => {
  let server;
  let received;

  afterEach(done => {
    server.close(done);
  });

  test.each([false, true])('returns the JSON response with batch=%s', async batch => {
    const records = [{ level: 'info', message: 'hello \u00e9' }];
    server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        received = JSON.parse(Buffer.concat(chunks).toString());
        const body = Buffer.from(JSON.stringify(records));
        const split = body.indexOf(Buffer.from('\u00e9')) + 1;
        res.write(body.subarray(0, split));
        res.end(body.subarray(split));
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const transport = new Http({ host: '127.0.0.1', port: server.address().port, batch });
    const options = {
      from: '2026-01-01T00:00:00Z', until: '2026-01-02T00:00:00Z',
      rows: 2, start: 1, order: 'asc', path: '/query'
    };
    const result = await new Promise((resolve, reject) => {
      transport.query(options, (err, data) => err ? reject(err) : resolve(data));
    });
    expect(result).toEqual(records);
    expect(received).toEqual({ method: 'query', params: {
      from: '2026-01-01T00:00:00.000Z', until: '2026-01-02T00:00:00.000Z',
      rows: 2, start: 1, order: 'asc'
    } });
    expect(options.path).toBe('/query');
    expect(transport.batchOptions).toEqual([]);
  });

  test.each(['not JSON', ''])('reports malformed response %j', async body => {
    server = http.createServer((req, res) => res.end(body));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const transport = new Http({ host: '127.0.0.1', port: server.address().port });
    await expect(new Promise((resolve, reject) => {
      transport.query((err, data) => err ? reject(err) : resolve(data));
    })).rejects.toBeInstanceOf(SyntaxError);
  });
});
