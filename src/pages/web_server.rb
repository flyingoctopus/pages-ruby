require 'sinatra'
require 'sinatra/base'
require 'json'

module MonomePages
  class WebServer < Sinatra::Base

    attr_accessor :server

    def initialize(serialosc, midi)

      @server = Sinatra.new do
        if $PAGES_DEBUG
          before do
            ap request.params unless request.params.empty?
          end
        end

        get '/' do
          File.read(File.join(File.dirname(__FILE__), *%w[ .. public index.html ]))
        end

        get '/devices/serialosc' do
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
          true
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
          true
        end

        delete '/midi_matrix' do
          device = serialosc.devices[params['device'].to_i]
          if params['page']
            page = serialosc.devices[params['device'].to_i].pages[params['page'].to_i]
          end
          midi.delete_map(device, params['map'].to_i, page)
          true
        end
      end
      @server.use Rack::CommonLogger
      @server.set :root, File.expand_path(File.join('..'), File.dirname(__FILE__))
      @server.run!
    end
  end
end
