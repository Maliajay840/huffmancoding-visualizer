
const inputText = document.getElementById("inputText");
const generateBtn = document.getElementById("generateBtn");

const frequencyTable = document.getElementById("frequencyTable");
const codesTable = document.getElementById("codesTable");
const treeDisplay = document.getElementById("tree");
const encodedDisplay = document.getElementById("encodedText");
const decodedDisplay = document.getElementById("decodedText");

// Step 1: Calculate frequency
function calculateFrequency(text) {
    const frequency = {};

    for (let char of text) {
        frequency[char] = (frequency[char] || 0) + 1;
    }

    return frequency;
}

// Step 2: Create Huffman Tree
function buildHuffmanTree(frequency) {
    let nodes = Object.entries(frequency).map(([char, freq]) => ({
        char,
        freq,
        left: null,
        right: null
    }));

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);

        const left = nodes.shift();
        const right = nodes.shift();

        const parent = {
            char: null,
            freq: left.freq + right.freq,
            left,
            right
        };

        nodes.push(parent);
    }

    return nodes[0];
}

// Step 3: Generate binary codes
function generateCodes(node, code = "", codes = {}) {
    if (!node) return codes;

    if (node.char !== null) {
        codes[node.char] = code || "0";
    }

    generateCodes(node.left, code + "0", codes);
    generateCodes(node.right, code + "1", codes);

    return codes;
}

// Step 4: Display frequency table
function displayFrequency(frequency) {
    let html = `
        <table>
            <tr>
                <th>Character</th>
                <th>Frequency</th>
            </tr>
    `;

    for (let char in frequency) {
        html += `
            <tr>
                <td>${char === " " ? "Space" : char}</td>
                <td>${frequency[char]}</td>
            </tr>
        `;
    }

    html += "</table>";
    frequencyTable.innerHTML = html;
}

// Step 5: Display codes
function displayCodes(codes) {
    let html = `
        <table>
            <tr>
                <th>Character</th>
                <th>Huffman Code</th>
            </tr>
    `;

    for (let char in codes) {
        html += `
            <tr>
                <td>${char === " " ? "Space" : char}</td>
                <td>${codes[char]}</td>
            </tr>
        `;
    }

    html += "</table>";
    codesTable.innerHTML = html;
}

// Step 6: Encode text
function encodeText(text, codes) {
    return Array.from(text)
        .map(char => codes[char])
        .join("");
}

// Step 7: Decode text
function decodeText(encoded, root) {
    if (root.char !== null) {
        return root.char.repeat(encoded.length);
    }

    let result = "";
    let current = root;

    for (let bit of encoded) {
        current = bit === "0" ? current.left : current.right;

        if (current.char !== null) {
            result += current.char;
            current = root;
        }
    }

    return result;
}

// Step 8: Display tree

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function displayTree(root) {
    if (!root) return "";

    let leafPosition = 0;
    const nodes = [];
    const edges = [];

    // Calculate positions of all nodes
    function calculatePositions(node, depth = 0) {
        if (!node) return 0;

        const current = {
            node,
            depth,
            x: 0,
            y: 70 + depth * 120
        };

        nodes.push(current);

        if (!node.left && !node.right) {
            current.x = 70 + leafPosition * 120;
            leafPosition++;
        } else {
            const leftX = node.left
                ? calculatePositions(node.left, depth + 1)
                : 0;

            const rightX = node.right
                ? calculatePositions(node.right, depth + 1)
                : 0;

            current.x = (leftX + rightX) / 2;
        }

        return current.x;
    }

    calculatePositions(root);

    // Find node positions
    function findPosition(node) {
        return nodes.find(item => item.node === node);
    }

    // Create connecting lines
    function createEdges(node) {
        if (!node) return;

        const parent = findPosition(node);

        if (node.left) {
            const child = findPosition(node.left);

            edges.push(`
                <line x1="${parent.x}" y1="${parent.y}"
                      x2="${child.x}" y2="${child.y}"
                      stroke="#38bdf8" stroke-width="2.5"/>

                <text x="${(parent.x + child.x) / 2 - 15}"
                      y="${(parent.y + child.y) / 2}"
                      fill="#facc15" font-size="16">0</text>
            `);

            createEdges(node.left);
        }

        if (node.right) {
            const child = findPosition(node.right);

            edges.push(`
                <line x1="${parent.x}" y1="${parent.y}"
                      x2="${child.x}" y2="${child.y}"
                      stroke="#38bdf8" stroke-width="2.5"/>

                <text x="${(parent.x + child.x) / 2 + 8}"
                      y="${(parent.y + child.y) / 2}"
                      fill="#facc15" font-size="16">1</text>
            `);

            createEdges(node.right);
        }
    }

    createEdges(root);

    // Draw circles and node values
    const circles = nodes.map(item => {
        const node = item.node;
        const isLeaf = node.char !== null;

        const label = isLeaf
            ? escapeHTML(node.char === " " ? "SPACE" : node.char)
            : node.freq;

        return `
            <g>
                <circle cx="${item.x}" cy="${item.y}" r="29"
                    fill="${isLeaf ? "#075985" : "#334155"}"
                    stroke="#38bdf8" stroke-width="2.5"/>

                <text x="${item.x}" y="${item.y - 3}"
                    text-anchor="middle"
                    fill="white" font-size="14"
                    font-weight="bold">${label}</text>

                <text x="${item.x}" y="${item.y + 14}"
                    text-anchor="middle"
                    fill="#cbd5e1" font-size="10">
                    ${isLeaf ? node.freq : "Node"}
                </text>
            </g>
        `;
    }).join("");

    const width = Math.max(600, leafPosition * 120 + 100);
    const maxDepth = Math.max(...nodes.map(item => item.depth));
    const height = (maxDepth + 1) * 120 + 80;

    return `
        <div class="tree-canvas">
            <svg viewBox="0 0 ${width} ${height}"
                 width="100%" height="100%"
                 style="min-width:${width}px"
                 xmlns="http://www.w3.org/2000/svg">

                ${edges.join("")}
                ${circles}

            </svg>
        </div>
    `;
}


// Main function
generateBtn.addEventListener("click", () => {
    const text = inputText.value;

    if (!text.length) {
        alert("Please enter some text!");
        return;
    }

    const frequency = calculateFrequency(text);

    const root = buildHuffmanTree(frequency);

    const codes = generateCodes(root);

    const encoded = encodeText(text, codes);

    const decoded = decodeText(encoded, root);

    displayFrequency(frequency);

    displayCodes(codes);

    treeDisplay.innerHTML = displayTree(root);

    encodedDisplay.innerHTML =
        `<div class="output">${encoded}</div>`;

    decodedDisplay.innerHTML =
        `<div class="output">${decoded}</div>`;
});
