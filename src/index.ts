import 'reflect-metadata';
import gqlServer from './server';
export * from './client';

const port = process.env.PORT || 4000;
const server = gqlServer();

server.listen(port, () => {
  console.log(`server started on http://localhost:${port}`); // eslint-disable-line no-console
});