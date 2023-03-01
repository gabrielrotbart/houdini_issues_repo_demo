# README

Run `bundle install`
Run 'yarn install' or 'npm install'

<!-- This will create a Postgresql DB and 2 Entries for testing -->
Run `bundle rails db:create db:migrate db:seed`

Run `foreman start`

or if you don't have foreman, both:
`vite: bin/vite dev`
and
`bin/rails s -p 3333`
