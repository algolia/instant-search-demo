#! /usr/bin/env ruby

require "json"
require "algoliasearch"
require "open-uri"


####
#### LAUNCH
####
if ARGV.length != 3
  $stderr << "usage: push.rb APPLICATION_ID API_KEY INDEX\n"
  exit 1
end

APPLICATION_ID = ARGV[0]
API_KEY = ARGV[1]
INDEX_BASE = ARGV[2]

####
#### LOAD DATA
####
products = JSON.parse File.read("bestbuy_dataset_light.json")


####
#### ALGOLIA INIT & CONFIGURATION
####
Algolia.init :application_id => APPLICATION_ID, :api_key => API_KEY
index = Algolia::Index.new(INDEX_BASE)

default_settings = {
  attributesToIndex: %w(brand unordered(name) unordered(categories) unordered(description)),
  customRanking: ['desc(popularity)'],
  attributesForFaceting: %w(brand categories free_shipping hierarchicalCategories.lvl0 hierarchicalCategories.lvl1 hierarchicalCategories.lvl2 price price_range type rating hierarchicalCategories.lvl3 hierarchicalCategories.lvl4 popularity),
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 7,
  ignorePlurals: true
}



index_settings = default_settings.merge({ slaves: %W(#{INDEX_BASE}_price_desc #{INDEX_BASE}_price_asc) })
price_desc_settings = default_settings.merge({ ranking: %w(desc(price) typo geo words proximity attribute exact custom), typoTolerance: "min" })
price_asc_settings = default_settings.merge({ ranking: %w(asc(price) typo geo words proximity attribute exact custom), typoTolerance: "min" })

index.set_settings(index_settings)
Algolia::Index.new("#{INDEX_BASE}_price_desc").set_settings(price_desc_settings)
Algolia::Index.new("#{INDEX_BASE}_price_asc").set_settings(price_asc_settings)


####
#### INDEXING
####
index.clear
products.each_slice(1000) do |batch|
	index.add_objects batch
end
