(() => {
    'use strict';

    /* ================= DOM references ================= */
    const inputText = document.getElementById('inputText');
    const generateBtn = document.getElementById('generateBtn');
    const frequencyTable = document.getElementById('frequencyTable');
    const treeBox = document.getElementById('tree');
    const codesTable = document.getElementById('codesTable');
    const encodedText = document.getElementById('encodedText');
    const decodedText = document.getElementById('decodedText');

    const SVG_NS = 'http://www.w3.org/2000/svg';

    // Decoded text me newline/spaces waise hi dikhein jaise likhe the
    decodedText.style.whiteSpace = 'pre-wrap';

    /* ================= Data structures ================= */

    let nextId = 0;

    class Node {
        constructor(char, freq, left = null, right = null) {
            this.id = nextId++;      // creation order -> tie-breaking
            this.char = char;        // null for internal nodes
            this.freq = freq;
            this.left = left;
            this.right = right;
        }

        get isLeaf() {
            return this.left === null && this.right === null;
        }
    }

    // Min-heap (priority queue): smallest frequency first, tie -> older node first
    class MinHeap {
        constructor() {
            this.data = [];
        }

        get size() {
            return this.data.length;
        }

        less(a, b) {
            return a.freq < b.freq || (a.freq === b.freq && a.id < b.id);
        }

        push(node) {
            const d = this.data;
            d.push(node);
            let i = d.length - 1;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (!this.less(d[i], d[p])) break;
                [d[i], d[p]] = [d[p], d[i]];
                i = p;
            }
        }

        pop() {
            const d = this.data;
            const top = d[0];
            const last = d.pop();
            if (d.length > 0) {
                d[0] = last;
                let i = 0;
                for (;;) {
                    const l = 2 * i + 1;
                    const r = l + 1;
                    let m = i;
                    if (l < d.length && this.less(d[l], d[m])) m = l;
                    if (r < d.length && this.less(d[r], d[m])) m = r;
                    if (m === i) break;
                    [d[i], d[m]] = [d[m], d[i]];
                    i = m;
                }
            }
            return top;
        }
    }

    /* ================= Huffman algorithm ================= */

    function getFrequencies(text) {
        const map = new Map();
        for (const ch of text) {
            map.set(ch, (map.get(ch) || 0) + 1);
        }
        return map;
    }

    function buildTree(freqMap) {
        nextId = 0;

        // Leaves pehle frequency ke hisaab se (chhote se bada), tie par character order
        const entries = [...freqMap.entries()].sort((a, b) =>
            a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
        );

        const heap = new MinHeap();
        entries.forEach(([ch, f]) => heap.push(new Node(ch, f)));

        // Jab tak ek hi node na bache: 2 minimum nikalo, merge karo, wapas daalo
        while (heap.size > 1) {
            const first = heap.pop();    // sabse chhota  -> left  (0)
            const second = heap.pop();   // doosra chhota -> right (1)
            heap.push(new Node(null, first.freq + second.freq, first, second));
        }

        return heap.pop();
    }

    function generateCodes(root) {
        const codes = new Map();

        // Sirf ek unique character ho to usko "0" code dete hain
        if (root.isLeaf) {
            codes.set(root.char, '0');
            return codes;
        }

        const stack = [[root, '']];
        while (stack.length) {
            const [node, prefix] = stack.pop();
            if (node.isLeaf) {
                codes.set(node.char, prefix);
            } else {
                stack.push([node.right, prefix + '1']);
                stack.push([node.left, prefix + '0']);
            }
        }
        return codes;
    }

    function encode(text, codes) {
        const parts = [];
        for (const ch of text) parts.push(codes.get(ch));
        return parts.join('');
    }

    function decode(bits, root) {
        if (root.isLeaf) {
            return root.char.repeat(bits.length);
        }

        const out = [];
        let node = root;
        for (const bit of bits) {
            node = bit === '0' ? node.left : node.right;
            if (node.isLeaf) {
                out.push(node.char);
                node = root;
            }
        }
        return out.join('');
    }

    /* ================= UI helpers ================= */

    function showChar(ch) {
        if (ch === ' ') return '␣';
        if (ch === '\n') return '↵';
        if (ch === '\t') return '⇥';
        if (ch === '\r') return '⏎';
        return ch;
    }

    function makeRow(values) {
        const tr = document.createElement('tr');
        values.forEach((v) => {
            const td = document.createElement('td');
            td.textContent = String(v);
            tr.appendChild(td);
        });
        return tr;
    }

    function clearElement(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function showPlaceholder(el, message) {
        clearElement(el);
        const p = document.createElement('p');
        p.className = 'placeholder';
        p.textContent = message;
        el.appendChild(p);
    }

    function svgEl(name, attrs, text) {
        const el = document.createElementNS(SVG_NS, name);
        for (const key in attrs) el.setAttribute(key, attrs[key]);
        if (text !== undefined) el.textContent = text;
        return el;
    }

    /* ================= Rendering ================= */

    function renderFrequencyTable(freqMap) {
        clearElement(frequencyTable);
        [...freqMap.entries()]
            .sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
            .forEach(([ch, f]) => {
                frequencyTable.appendChild(makeRow([showChar(ch), f]));
            });
    }

    function renderCodesTable(freqMap, codes) {
        clearElement(codesTable);
        [...codes.entries()]
            .sort((a, b) =>
                a[1].length - b[1].length ||
                (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)
            )
            .forEach(([ch, code]) => {
                codesTable.appendChild(makeRow([showChar(ch), freqMap.get(ch), code]));
            });
    }

    function renderTree(root) {
        clearElement(treeBox);

        // Bade numbers (jaise 79527) circle me fit ho, isliye radius digits ke hisaab se
        const digits = String(root.freq).length;
        const R = Math.max(24, 4 * digits + 8);
        const X_GAP = Math.max(64, 2 * R + 12);
        const Y_GAP = Math.max(86, 2 * R + 34);
        const PAD = R + 16;

        // Layout: leaves left se right, parent apne dono bacchon ke beech me
        const pos = new Map();
        let leafIndex = 0;
        let maxDepth = 0;

        (function layout(node, depth) {
            if (depth > maxDepth) maxDepth = depth;
            if (node.isLeaf) {
                pos.set(node, { x: leafIndex++, depth });
                return;
            }
            layout(node.left, depth + 1);
            layout(node.right, depth + 1);
            pos.set(node, {
                x: (pos.get(node.left).x + pos.get(node.right).x) / 2,
                depth
            });
        })(root, 0);

        const width = Math.max(260, (leafIndex - 1) * X_GAP + PAD * 2);
        const height = maxDepth * Y_GAP + PAD * 2;
        const px = (n) => PAD + pos.get(n).x * X_GAP + (width - ((leafIndex - 1) * X_GAP + PAD * 2)) / 2;
        const py = (n) => PAD + pos.get(n).depth * Y_GAP;

        const svg = svgEl('svg', {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'img',
            'aria-label': 'Huffman binary tree'
        });

        const edgeLayer = svgEl('g');
        const nodeLayer = svgEl('g');
        svg.appendChild(edgeLayer);
        svg.appendChild(nodeLayer);

        (function draw(node) {
            const x = px(node);
            const y = py(node);

            if (!node.isLeaf) {
                [[node.left, '0', -1], [node.right, '1', 1]].forEach(([child, bit, side]) => {
                    const cx = px(child);
                    const cy = py(child);

                    edgeLayer.appendChild(svgEl('line', {
                        class: 'tree-edge',
                        x1: x, y1: y, x2: cx, y2: cy
                    }));

                    edgeLayer.appendChild(svgEl('text', {
                        class: 'edge-label',
                        x: (x + cx) / 2 + side * 12,
                        y: (y + cy) / 2,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle',
                        stroke: '#0f172a',
                        'stroke-width': 4,
                        'paint-order': 'stroke'
                    }, bit));

                    draw(child);
                });
            }

            nodeLayer.appendChild(svgEl('circle', {
                class: node.isLeaf ? 'tree-node leaf' : 'tree-node',
                cx: x, cy: y, r: R
            }));

            if (node.isLeaf) {
                nodeLayer.appendChild(svgEl('text', { class: 'node-label', x, y: y - 7 }, showChar(node.char)));
                nodeLayer.appendChild(svgEl('text', { class: 'node-label', x, y: y + 9 }, String(node.freq)));
            } else {
                nodeLayer.appendChild(svgEl('text', { class: 'node-label', x, y }, String(node.freq)));
            }
        })(root);

        treeBox.appendChild(svg);
    }

    function renderEncoded(text, encoded) {
        clearElement(encodedText);

        const bitsBox = document.createElement('div');
        bitsBox.textContent = encoded;
        encodedText.appendChild(bitsBox);

        const originalBits = [...text].length * 8;
        const compressedBits = encoded.length;
        const saved = ((1 - compressedBits / originalBits) * 100).toFixed(1);

        const info = document.createElement('div');
        info.className = 'description';
        info.textContent =
            `Original (8-bit ASCII): ${originalBits} bits | ` +
            `Huffman: ${compressedBits} bits | Saved: ${saved}%`;
        encodedText.appendChild(info);
    }

    function resetOutputs(message) {
        clearElement(frequencyTable);
        clearElement(codesTable);
        showPlaceholder(treeBox, message);
        encodedText.textContent = 'Encoded result will appear here.';
        decodedText.textContent = 'Decoded result will appear here.';
    }

    /* ================= Main ================= */

    function generate() {
        const text = inputText.value;

        if (text.length === 0) {
            resetOutputs('Please enter some text first.');
            return;
        }

        const freqMap = getFrequencies(text);
        const root = buildTree(freqMap);
        const codes = generateCodes(root);
        const encoded = encode(text, codes);
        const decoded = decode(encoded, root);

        renderFrequencyTable(freqMap);
        renderTree(root);
        renderCodesTable(freqMap, codes);
        renderEncoded(text, encoded);
        decodedText.textContent = decoded;
    }

    generateBtn.addEventListener('click', generate);

    // Ctrl + Enter se bhi generate ho jaye
    inputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            generate();
        }
    });

    // Page khulte hi default text ka result dikhao
    generate();
})();
