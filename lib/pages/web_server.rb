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

      post '/devices/serialos' do
        if !params.has_key?(:name) 
          return
        end
        device = serialosc.devices[params[:name]]
        if params.has_key?(:code)
          device.instance_eval params[:code]
        end
      end

      post '/pages' do
        device = serialosc.devices[params[:device]]
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
        device = serialosc.devices[params[:device]]
        page = device.pages.has_key?(params[:page_id]) ? device.pages[params[:page_id]] : nil
        midi.add_map(params[:midi_id], params[:type], device, page)
      end
    end
  end
end


