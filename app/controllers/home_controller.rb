class HomeController < ApplicationController
  def index
    render inertia: 'Home/Index',
      props: entries_props
  end

  private

  def entries_props
    results = DemoSchema.execute(entries_query)
    results.to_h['data']
  end

  def entries_query
    '{
      entries {
        id,
        name,
        description
      }
    }'
  end
end
