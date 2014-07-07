#! /usr/bin/env ruby

require 'json'
require 'algoliasearch'

if ARGV.length != 3
  $stderr << "usage: push.rb APPLICATION_ID API_KEY INDEX\n"
  exit 1
end

products = JSON.parse File.read(File.join(__FILE__, '..', 'data.json'))

Algolia.init :application_id => ARGV[0], :api_key => ARGV[1]

index = Algolia::Index.new(ARGV[2])
index.set_settings :attributesToIndex => ["name", "categories", "city"],
  :customRanking => ["desc(score)"],
  :attributesForFaceting => ["categories", "city", "open", "stars", "review_count", "review_count_range"],
  :slaves => ["#{ARGV[2]}_rating_desc", "#{ARGV[2]}_review_count_desc"]
index.clear_index! rescue 'not fatal'
res = index.add_objects products
index.wait_task res['taskID']

Algolia::Index.new("#{ARGV[2]}_rating_desc").set_settings :attributesToIndex => ["name", "categories", "city"],
  :customRanking => ["desc(score)"],
  :attributesForFaceting => ["categories", "city", "open", "stars", "review_count", "review_count_range"],
  :ranking => ["desc(stars)", "desc(review_count)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]

Algolia::Index.new("#{ARGV[2]}_review_count_desc").set_settings :attributesToIndex => ["name", "categories", "city"],
  :customRanking => ["desc(score)"],
  :attributesForFaceting => ["categories", "city", "open", "stars", "review_count", "review_count_range"],
  :ranking => ["desc(review_count)", "desc(stars)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]
