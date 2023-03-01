# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)

[
  {
    name: "Entry 1",
    description: "Description 1"
  },
  {
    name: "Entry 2",
    description: "Description 2"
  }
].each do |entry|
  Entry.create(entry)
end