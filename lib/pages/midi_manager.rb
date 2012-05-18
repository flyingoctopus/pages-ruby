require 'unimidi'

module MonomePages
  class MIDIManager

    attr_accessor :matrix, :devices

    def initialize
      @matrix = {}
      @devices = { :output => {}, :input => {} }
      scan_devices
      @inputs = []
      @outputs = []
    end

    def scan_devices
      UniMIDI::Output.all.each do |device|
        @devices[:output][device.id] = 
          { :name => device.pretty_name, :open => false, :device => device }
      end

      @devices[:output].each do |k,v|
        @devices[:output].delete(k) if UniMIDI::Output.all.find { |d| d.id == k } == nil
      end

      UniMIDI::Input.all.each do |device|
        @devices[:input][device.id] = 
          { :name => device.pretty_name, :open => false, :device => device }
      end
      @devices[:input].each do |k,v|
        @devices[:input].delete(k) if UniMIDI::Input.all.find { |d| d.id == k } == nil
      end
    end

    def add_map(id, type, device, page=nil)
      if @devices[type][id][:open] == false
        @devices[type][id][:device].open
        @devices[type][id][:open] = true
      end

      if @matrix[device.id] == nil
        @matrix[device.id] = { :map => [], :pages => {} }
      end

      if page == nil
        @matrix[device.id][:map].push( { :id => id, :type => type } )
      else
        @matrix[device.id][:pages][page.id] = { :map => [] } unless @matrix[device.id][:pages][page.id]
        @matrix[device.id][:pages][page.id][:map].push( { :id => id, :type => type } )
      end
      true
    end

    def delete_map(device, map_idx, page=nil)
      if page == nil
        @matrix[device.id][:map].delete_at map_idx
      else
        @matrix[device.id][:pages][page.id][:map].delete_at map_idx
      end
    end

  end
end