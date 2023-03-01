Rails.application.routes.draw do
  if Rails.env.development?
    get "/graphqiql", to: "graphql#graphiql"
  end

  post "/graphql", to: "graphql#execute"

  get 'home/index'
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  root "home#index"

  resources :entries
end
