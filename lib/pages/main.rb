require_relative 'serialosc'

module MonomePages
  class Main

    attr_reader :serialosc

    def initialize
      @serialosc = SerialOSC.new
      @serialosc.detect
    end

  end
end

main = MonomePages::Main.new

require 'sinatra'
require 'json'

get '/' do
  File.read(File.join('public', 'index.html'))
end

get '/devices' do
  main.serialosc.detect
  sleep 0.1
  main.serialosc.devices.to_json
end

post '/devices' do
  if !params.has_key?(:name) 
    return
  end
  device = main.serialosc.devices[params[:name]]
  if params.has_key?(:code)
    device.instance_eval params[:code]
  end
end

post '/pages' do
  puts "adding page " + params[:name] + " to device " + params[:device]
  device = main.serialosc.devices[params[:device]]
  device.add_page params[:name]
  device.pages.to_json
end