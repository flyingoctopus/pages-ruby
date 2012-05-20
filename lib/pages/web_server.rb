require 'sinatra'
require 'json'

module MonomePages
  class WebServer
    def initialize(serialosc, midi)

      if $PAGES_DEBUG
        before do
          ap request.params unless request.params.empty?
        end
      end

      get '/' do
        File.read(File.join(File.dirname(__FILE__), *%w[ .. public index.html ]))
      end

      get '/devices/serialosc' do
        serialosc.detect
        sleep 0.1
        serialosc.devices.to_json
      end

      post '/devices/serialosc' do
        if !params.has_key?(:name) 
          return
        end
        device = serialosc.devices[params[:name]]
        if params.has_key?(:code)
          device.instance_eval params[:code]
        end
      end

      post '/pages' do
        device = serialosc.devices[params[:device].to_i]
        device.add_page params[:name]
        device.pages.to_json
      end

      get '/devices/midi' do
        midi.scan_devices
        midi.devices.to_json
      end

      get '/midi_matrix' do
        midi.matrix.to_json
      end

      post '/midi_matrix' do
        device = serialosc.devices[params[:device].to_i]
        page = device.pages[params[:page].to_i] ? device.pages[params[:page].to_i] : nil
        midi.add_map(params[:midi].to_i, params[:type].to_sym, device, page)
      end

      delete '/midi_matrix' do
        device = serialosc.devices[params['device'].to_i]
        if params['page']
          page = serialosc.devices[params['device'].to_i].pages[params['page'].to_i]
        end
        midi.delete_map(device, params['map'].to_i, page)
      end
    end
  end
end