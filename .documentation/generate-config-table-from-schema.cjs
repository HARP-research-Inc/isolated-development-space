#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const schemaPath = path.join(path.resolve(__dirname, "..", "charts", "isolated-development-space", "values.schema.json"));

const schema = require(schemaPath);

const header = `| Value Name | Description | Required | Default Value |`;
const headerSeperator = `|:---:|:---:|:---:|:---:|`;

function makeIntoInlineCode(string) {
    return string ? "`" + string + "`" : null;
}

function getRows(object, prefix = null) {
    const entries = Object.entries(object.properties);
    entries.sort(([key1], [key2]) => key1.localeCompare(key2)); // Sort by key name
    return entries.flatMap(([key, value]) => {
        const keyName = prefix ? `${prefix}.${key}` : key;
        const base = [
            `| ${makeIntoInlineCode(keyName)} | ${value.description} | ${(object.required ?? []).includes(key) ? "Yes" : "No"} | ${makeIntoInlineCode(value.default) ?? "-"} |`
        ];
        if (value.type === "object") {
            base.push(...getRows(value, keyName));
        }
        return base;
    });
}

function generateTable(schema) {
    const rows = getRows(schema);
    return [header, headerSeperator, ...rows].join("\n");
}

function getExampleSchema(object, level = 0, minimal = false) {
    let entries = Object.entries(object.properties);
    entries.sort(([key1], [key2]) => key1.localeCompare(key2)); // Sort by key name
    if (minimal) {
        entries = entries.filter(([key]) => (object.required ?? []).includes(key));
    }
    return entries.flatMap(([key, value]) => {
        const keyName = key;
        let defaultValue = value.examples?.[0] || value.default || "";
        if (value.type === "string") {
            defaultValue = `"${defaultValue}"`;
        }
        const base = [
            `${"  ".repeat(level)}${keyName}: ${defaultValue ?? ""}`
        ];
        if (value.type === "object") {
            base.push(...getExampleSchema(value, level + 1));
        }
        return base;
    });
}

const readmePath = path.join(path.resolve(__dirname, "..", "README.md"));
const readme = fs.readFileSync(readmePath, 'utf8');

const table = generateTable(schema);
const exampleHeading = "### Example `values.yaml`";
const minimalExampleHeading = "\n\n#### Minimal `values.yaml`";
const fullExampleHeading = "\n\n#### Full `values.yaml`";
const yamlFenceFirstHalf = "\n\n```yaml\n";
const yamlFenceSecondHalf = "\n```";
const minimalExample = minimalExampleHeading + yamlFenceFirstHalf + getExampleSchema(schema, 0, true).join("\n") + yamlFenceSecondHalf;
const fullExample = fullExampleHeading + yamlFenceFirstHalf + getExampleSchema(schema).join("\n") + yamlFenceSecondHalf;
const example = exampleHeading + minimalExample + fullExample;


const startMarker = "<!-- add-values-table-here-start -->\n"
const endMarker = "\n<!-- add-values-table-here-end -->"
const startIdx = readme.indexOf(startMarker);
const endIdx = readme.indexOf(endMarker);

const firstHalf = readme.substring(0, startIdx + startMarker.length);
const secondHalf = readme.substring(endIdx);

const newReadme = firstHalf + "\n" + table + "\n\n" + example + "\n" + secondHalf;

fs.writeFileSync(readmePath, newReadme, 'utf8');