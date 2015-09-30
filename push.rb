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


####
#### LOAD DATA
####
products = JSON.parse File.read("data.json")


####
#### ALGOLIA INIT & CONFIGURATION
####
Algolia.init :application_id => ARGV[0], :api_key => ARGV[1]
index = Algolia::Index.new(ARGV[2])

default_settings = {
  attributesToIndex: ['brand', 'name', 'categories', 'hierarchicalCategories', 'unordered(description)'],
  customRanking: ['desc(popularity)'],
  attributesForFaceting: ['brand', 'price_range', 'categories', 'hierarchicalCategories', 'type', 'price'],
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 7
}
index_settings = default_settings.clone
index_settings["ignorePlurals"] = true
index_settings["slaves"] = ["#{ARGV[2]}_price_desc", "#{ARGV[2]}_price_asc"]
price_desc_settings = default_settings.clone
price_desc_settings["ranking"] = ["desc(price)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]
price_asc_settings = default_settings.clone
price_asc_settings["ranking"] = ["asc(price)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]

index.set_settings(index_settings)
Algolia::Index.new("#{ARGV[2]}_price_desc").set_settings(price_desc_settings)
Algolia::Index.new("#{ARGV[2]}_price_asc").set_settings(price_asc_settings)


####
#### INDEXING
####
index.clear
products.each_slice(1000) do |batch|
	index.add_objects batch
end


