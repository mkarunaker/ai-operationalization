# Development

Use Node 22.5 or newer. This workspace currently uses the Node built-in `node:sqlite` module, so Docker, PostgreSQL, and a host `psql` executable are not required.

Run `npm run db:migrate` before starting the app. `npm run content:index` currently validates configured content-source paths; parsing and FTS indexing begin in Milestone 2.
