export const toMoney = (value: string | number | string[], fixed: boolean) => {
	if (!value) value = 0;

	if (typeof value !== 'string') {
		value = String(value);
	}

	let fix = '00';

	if (value.includes('.')) {
		const split = value.split('.');
		value = split[0];
		fix = split[1];
	}

	value = value.split('').reverse();
	for (let i in value) {
		if ((Number(i) - 3) % 3 === 0 && Number(i) !== 0) {
			value[i] = `${value[i]},`;
		}
	}

	if (fixed) {
		return `${value.reverse().join('')}`;
	}
	return `${value.reverse().join('')}.${fix}`;
};
