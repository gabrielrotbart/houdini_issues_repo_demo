module Queries
  class FetchEntries < Queries::BaseQuery
    type [Types::EntryType], null: false

    def resolve
      Entry.all
    end
  end
end
