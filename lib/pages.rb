$: << '.'
require 'pages/serialosc'
require 'pages/midi_manager'

module MonomePages
  class Main

    attr_reader :serialosc, :midi

    def initialize
      @serialosc = MonomePages::SerialOSC.new
      @midi = MonomePages::MIDIManager.new
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
  puts "adding page " + params[:name] + " to device " + params[:device_id]
  device = main.serialosc.devices[params[:device_id]]
  device.add_page params[:name]
  device.pages.to_json
end

get '/midi_devices' do
  main.midi.scan_devices
  main.midi.devices.to_json
end

get '/midi_matrix' do
  main.midi.matrix.to_json
end

post '/midi_matrix' do
  device = main.serialosc.devices[params[:device_id]]
  page = device.pages.has_key?(params[:page_id]) ? device.pages[params[:page_id]] : nil
  main.midi.add_map(params[:midi_id], params[:type], device, page)
end