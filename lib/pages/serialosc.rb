require 'dnssd'
require_relative 'serialosc_device'

module MonomePages
  class SerialOSC

    attr_reader :services, :devices

    def initialize
      @services = {}
      @devices = {}
    end

    def detect
      puts "detect"
      @browseThread = Thread.start do
        DNSSD.browse! '_monome-osc._udp', 'local' do |reply|
          DNSSD.resolve reply do |service|
            next if @services.has_key? service.name
            @services[service.name] = service
            device = MonomePages::SerialOSCDevice.new service
            device.start_osc_server
            device.init_device
            puts @devices.inspect
            sleep 0.1
            @devices[device.id] = device
            puts @devices.inspect
          end
        end
      end
    end

    def register(name, port)
      DNSSD.register! name, '_monome-osc._udp', 'local', port
    end

  end
end
