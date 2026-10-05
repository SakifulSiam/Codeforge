export const sortingAlgorithms = {
  bubble: { name: 'Bubble sort', time: 'O(n²)', space: 'O(1)', description: 'Compare neighbors and swap them. Each pass moves the largest remaining value to the end.' },
  insertion: { name: 'Insertion sort', time: 'O(n²)', space: 'O(1)', description: 'Take the next value and insert it into the ordered prefix by shifting larger values right.' },
  selection: { name: 'Selection sort', time: 'O(n²)', space: 'O(1)', description: 'Find the smallest remaining value and place it at the next position.' },
  merge: { name: 'Merge sort', time: 'O(n log n)', space: 'O(n)', description: 'Split the array into halves, sort each half, and merge the ordered halves.' },
  quick: { name: 'Quick sort', time: 'O(n²) worst', space: 'O(n) worst', description: 'Use the last value as a pivot, partition smaller values to its left, then sort both sides. Average time: O(n log n); average stack: O(log n).' },
};

export function createArray(size, order = 'random') {
  const values = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
  if (order === 'sorted') values.sort((a, b) => a - b);
  if (order === 'reversed') values.sort((a, b) => b - a);
  if (order === 'duplicates') return values.map((value) => Math.ceil(value / 20) * 20);
  return values;
}

export function buildSortingSteps(input, algorithm) {
  const values = [...input];
  const frames = [];
  const sorted = new Set();
  let comparisons = 0;
  let writes = 0;
  const record = (message, active = [], pivot = -1) => {
    frames.push({ values: [...values], active: [...active], sorted: [...sorted], pivot, comparisons, writes, message });
  };
  const swap = (a, b, pivot = -1) => {
    if (a === b) return;
    [values[a], values[b]] = [values[b], values[a]];
    writes += 2;
    record(`Swap positions ${a + 1} and ${b + 1}.`, [a, b], pivot);
  };
  record('Ready. Press Start or Step to follow the algorithm.');

  function bubbleSort() {
    for (let end = values.length - 1; end > 0; end--) {
      let changed = false;
      for (let j = 0; j < end; j++) {
        comparisons++;
        record(`Compare ${values[j]} and ${values[j + 1]}.`, [j, j + 1]);
        if (values[j] > values[j + 1]) {
          swap(j, j + 1);
          changed = true;
        }
      }
      sorted.add(end);
      record(`Position ${end + 1} is now in its final place.`);
      if (!changed) break;
    }
  }

  function insertionSort() {
    for (let i = 1; i < values.length; i++) {
      const key = values[i];
      let j = i - 1;
      record(`Hold ${key} and find its place in the ordered prefix.`, [i]);
      while (j >= 0) {
        comparisons++;
        record(`Compare ${values[j]} with held value ${key}.`, [j, j + 1]);
        if (values[j] <= key) break;
        values[j + 1] = values[j];
        writes++;
        record(`Shift ${values[j]} one position right.`, [j, j + 1]);
        j--;
      }
      values[j + 1] = key;
      writes++;
      record(`Insert ${key} at position ${j + 2}. The first ${i + 1} values are ordered.`, [j + 1]);
    }
  }

  function selectionSort() {
    for (let i = 0; i < values.length - 1; i++) {
      let minimum = i;
      for (let j = i + 1; j < values.length; j++) {
        comparisons++;
        record(`Compare candidate ${values[j]} with minimum ${values[minimum]}.`, [minimum, j]);
        if (values[j] < values[minimum]) {
          minimum = j;
          record(`New minimum: ${values[minimum]}.`, [minimum]);
        }
      }
      swap(i, minimum);
      sorted.add(i);
      record(`Position ${i + 1} is now in its final place.`);
    }
  }

  function mergeSort(left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    record(`Split positions ${left + 1}–${right + 1} into two halves.`, [left, mid, right]);
    mergeSort(left, mid);
    mergeSort(mid + 1, right);
    const first = values.slice(left, mid + 1);
    const second = values.slice(mid + 1, right + 1);
    let i = 0, j = 0, position = left;
    while (i < first.length || j < second.length) {
      let next;
      if (i < first.length && j < second.length) {
        comparisons++;
        record(`Compare buffered values ${first[i]} and ${second[j]}.`, [left + i, mid + 1 + j]);
        next = first[i] <= second[j] ? first[i++] : second[j++];
      } else {
        next = i < first.length ? first[i++] : second[j++];
      }
      values[position] = next;
      writes++;
      record(`Merge: write ${next} at position ${position + 1}.`, [position]);
      position++;
    }
  }

  function quickSort(low, high) {
    if (low > high) return;
    if (low === high) {
      sorted.add(low);
      record(`Position ${low + 1} is now in its final place.`);
      return;
    }
    const pivot = values[high];
    let boundary = low;
    record(`Choose ${pivot} as pivot for positions ${low + 1}–${high + 1}.`, [], high);
    for (let j = low; j < high; j++) {
      comparisons++;
      record(`Compare ${values[j]} with pivot ${pivot}.`, [j], high);
      if (values[j] < pivot) {
        swap(boundary, j, high);
        boundary++;
      }
    }
    swap(boundary, high);
    sorted.add(boundary);
    record(`Pivot ${pivot} is in its final position ${boundary + 1}.`);
    quickSort(low, boundary - 1);
    quickSort(boundary + 1, high);
  }

  if (algorithm === 'bubble') bubbleSort();
  else if (algorithm === 'insertion') insertionSort();
  else if (algorithm === 'selection') selectionSort();
  else if (algorithm === 'merge') mergeSort(0, values.length - 1);
  else if (algorithm === 'quick') quickSort(0, values.length - 1);
  else throw new Error('Unknown sorting algorithm.');

  values.forEach((_, index) => sorted.add(index));
  record('Sorted! Every value is in its final position.');
  return frames;
}
