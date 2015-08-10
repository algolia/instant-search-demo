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
#### HELPER METHODS
####
def get_price_range price
	case price
	when 0..50
		"1 - 50"
	when 50..100
		"50 - 100"
	when 100..200
		"100 - 200"
	when 200..500
		"200 - 500"
	when 500..2000
		"500 - 2000"
	else
		"> 2000"
	end
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
index.set_settings({
	attributesToIndex: ["brand", "name", "categories", "unordered(description)"],
	customRanking: ["desc(popularity)"],
	attributesForFaceting: ["brand", "price_range", "categories", "type", "price"],
	minWordSizefor1Typo: 3,
	minWordSizefor2Typos: 7,
	ignorePlurals: true,
	slaves: ["#{ARGV[2]}_price_desc", "#{ARGV[2]}_price_asc"]
	})
Algolia::Index.new("#{ARGV[2]}_price_desc").set_settings({
	attributesToIndex: ["brand", "name", "categories", "unordered(description)"],
	customRanking: ["desc(popularity)"],
	attributesForFaceting: ["brand", "price_range", "categories", "type", "price"],
	minWordSizefor1Typo: 3,
	minWordSizefor2Typos: 7,
	ignorePlurals: true,
	typoTolerance: "min",
	ranking:  ["desc(price)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]
	})
Algolia::Index.new("#{ARGV[2]}_price_asc").set_settings({
	attributesToIndex: ["brand", "name", "categories", "unordered(description)"],
	customRanking: ["desc(popularity)"],
	attributesForFaceting: ["brand", "price_range", "categories", "type", "price"],
	minWordSizefor1Typo: 3,
	minWordSizefor2Typos: 7,
	ignorePlurals: true,
	typoTolerance: "min",
	ranking:  ["asc(price)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]
	})


####
#### INDEXING
####
index.clear
products.each_slice(1000) do |batch|
	index.add_objects batch
end


