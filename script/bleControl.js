class BleControl {

	constructor() {
		this.currentDevice = null;
		// get this.connected return (this.currentDevice && this.currentDevice.gatt.connected);
	}

	requestDevice(filters) {
		let options = {
			filters: filters || [],
			acceptAllDevices: !filters,
			optionalServices: [0xFE59,0x1811,0x1815,0x180F,0x1810,0x181B,0x181E,0x181F,0x1805,0x1818,0x1816,0x180A,0x181A,0x1800,0x1801,0x1808,0x1809,0x180D,0x1812,0x1802,0x1821,0x1820,0x1803,0x1819,0x1807,0x180E,0x1822,0x1806,0x1814,0x1813,0x1804,0x181C,0x181D]
		}

		if (filters) {
			if (filters.constructor === [].constructor) {
				filters = filters.map(filter => {
					return {
						services: [filter]
					};
				});
			} else {
				filters = [{ services: [filters] }];
			}
			options.filters = filters;
		}

		return navigator.bluetooth.requestDevice(options)
		.then(device => {
			this.currentDevice = device;
			this.currentDevice.addEventListener("gattserverdisconnected", this.disconnectDevice.bind(this));
			return device;
		});
	}

	connectDevice() {
		return this.currentDevice.gatt.connect()
		.then(gattServer => {
			return this.currentDevice;
		});
	}

	listServices() {
		return this.currentDevice.gatt.getPrimaryServices();
	}

	listCharacteristics(service) {
		return service.getCharacteristics()
		.then(characteristics => {
			let promises = characteristics.map(characteristic => {
				return characteristic.readValue()
				.then(value => characteristic);
			});

			return Promise.all(promises);
		});
	}

	listDescriptors(characteristic) {
		return characteristic.getDescriptors()
		.then(descriptors => {
			let promises = descriptors.map(descriptor => {
				return descriptor.readValue()
				.then(value => descriptor);
			});

			return Promise.all(promises);
		});
	}

	disconnectDevice() {
		if (this.currentDevice.gatt.connected) {
			this.currentDevice.gatt.disconnect();
		}
		if (this.currentDevice) {
			this.currentDevice = null;
		}
	}
}
