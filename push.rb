#! /usr/bin/env ruby

require 'json'
require 'algoliasearch'
require 'open-uri'

if ARGV.length != 3
  $stderr << "usage: push.rb APPLICATION_ID API_KEY INDEX\n"
  exit 1
end

def price_range(price)
  if price < 50
    "1 - 50"
  elsif price < 100
    "101 - 200"
  elsif price < 500
    "201 - 500"
  elsif price < 2000
    "501 - 2000"
  elsif price < 5000
    "2001 - 5000"
  else
    "> 5000"
  end
end

# The following code fetch the data from the API using the BESTBUY_API_KEY environment variable
#
# products = []
# (1..100).each do |page|
#   url = "http://api.remix.bestbuy.com/v1/products(bestSellingRank%3E0%26active%3Dtrue)?format=json&pageSize=100&show=sku,name,shortDescription,bestSellingRank,thumbnailImage,salePrice,manufacturer,freeShipping,url,categoryPath.name,type,image,customerReviewCount&sort=bestSellingRank.asc&page=#{page}&apiKey=#{ENV['BESTBUY_API_KEY']}"
#   products += JSON.parse(open(url).read)['products'].map do |p|
#     p['category'] = p.delete('categoryPath').last['name'].gsub(/^All /, '') rescue nil
#     p['objectID'] = p.delete('sku')
#     p['shipping'] = p.delete('freeShipping') ? 'Free shipping' : nil
#     p['salePrice_range'] = price_range(p['salePrice'].to_i)
#     p
#   end
#   sleep(2) if (page + 1) % 5 == 0 # rate limits
# end
# File.open("data.json", "w") { |f| f << JSON.pretty_generate(products) }
products = JSON.parse File.read(File.join(__FILE__, '..', 'data.json'))

Algolia.init :application_id => ARGV[0], :api_key => ARGV[1]

index = Algolia::Index.new(ARGV[2])
index.set_settings :attributesToIndex => ["name", "manufacturer", "unordered(shortDescription)", "category"],
  :customRanking => ["asc(bestSellingRank)"],
  :attributesForFaceting => ["category", "salePrice", "manufacturer", "shipping", "type", "customerReviewCount", "salePrice_range"],
  :slaves => ["#{ARGV[2]}_price_desc", "#{ARGV[2]}_price_asc"]
index.clear_index! rescue 'not fatal'
res = index.add_objects products
index.wait_task res['taskID']

Algolia::Index.new("#{ARGV[2]}_price_desc").set_settings :attributesToIndex => ["name", "manufacturer", "unordered(shortDescription)", "category"],
  :customRanking => ["asc(bestSellingRank)"],
  :attributesForFaceting => ["category", "salePrice", "manufacturer", "shipping", "type", "customerReviewCount", "salePrice_range"],
  :ranking => ["desc(salePrice)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]

Algolia::Index.new("#{ARGV[2]}_price_asc").set_settings :attributesToIndex => ["name", "manufacturer", "unordered(shortDescription)", "category"],
  :customRanking => ["asc(bestSellingRank)"],
  :attributesForFaceting => ["category", "salePrice", "manufacturer", "shipping", "type", "customerReviewCount", "salePrice_range"],
  :ranking => ["asc(salePrice)", "typo", "geo", "words", "proximity", "attribute", "exact", "custom"]
