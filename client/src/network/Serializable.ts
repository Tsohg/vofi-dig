export function Serializable(...keys: string[]) {
	return function<T extends new(...args: any[]) => any>(constructor: T) {
		constructor["serialize"] = (self) => {
			const data = {};
			for (const key of keys)
				data[key] = getValueFromPath(self, key)
			return data;
		}
		constructor["deserialize"] = (self, data) => {
			for (const path in data) {
				const value = data[path];
				setValueFromPath(self, path, value);
			}
		}
		return constructor
	}
}

export function getValueFromPath(object: object, path: string): any {
	return path.split(".").reduce((prev, key) => prev ? prev[key] : null, object);
}

export function setValueFromPath(object: object, path: string, value: any) {
	let current = object;
	let pathElements = path.split(".");
	for (let i = 0; i < pathElements.length - 1; i++) {
		const key = pathElements[i];
		current = current ? current[key] : null;
	}
	if (current)
		current[pathElements[pathElements.length - 1]] = value;
}
