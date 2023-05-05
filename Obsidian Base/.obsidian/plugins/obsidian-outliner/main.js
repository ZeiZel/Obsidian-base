'use strict';

var obsidian = require('obsidian');
var view = require('@codemirror/view');
var language = require('@codemirror/language');
var state = require('@codemirror/state');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class MoveCursorToPreviousUnfoldedLine {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = this.root.getListUnderCursor();
        const cursor = this.root.getCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => {
            return (cursor.ch === l.from.ch + list.getCheckboxLength() &&
                cursor.line === l.from.line);
        });
        if (lineNo === 0) {
            this.moveCursorToPreviousUnfoldedItem(root, cursor);
        }
        else if (lineNo > 0) {
            this.moveCursorToPreviousNoteLine(root, lines, lineNo);
        }
    }
    moveCursorToPreviousNoteLine(root, lines, lineNo) {
        this.stopPropagation = true;
        this.updated = true;
        root.replaceCursor(lines[lineNo - 1].to);
    }
    moveCursorToPreviousUnfoldedItem(root, cursor) {
        const prev = root.getListUnderLine(cursor.line - 1);
        if (!prev) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        if (prev.isFolded()) {
            const foldRoot = prev.getTopFoldRoot();
            const firstLineEnd = foldRoot.getLinesInfo()[0].to;
            root.replaceCursor(firstLineEnd);
        }
        else {
            root.replaceCursor(prev.getLastLineContentEnd());
        }
    }
}

function getEditorFromState(state) {
    const { editor } = state.field(obsidian.editorInfoField);
    if (!editor) {
        return null;
    }
    return new MyEditor(editor);
}
function foldInside(view, from, to) {
    let found = null;
    language.foldedRanges(view.state).between(from, to, (from, to) => {
        if (!found || found.from > from)
            found = { from, to };
    });
    return found;
}
class MyEditor {
    constructor(e) {
        this.e = e;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.view = this.e.cm;
    }
    getCursor() {
        return this.e.getCursor();
    }
    getLine(n) {
        return this.e.getLine(n);
    }
    lastLine() {
        return this.e.lastLine();
    }
    listSelections() {
        return this.e.listSelections();
    }
    getRange(from, to) {
        return this.e.getRange(from, to);
    }
    replaceRange(replacement, from, to) {
        return this.e.replaceRange(replacement, from, to);
    }
    setSelections(selections) {
        this.e.setSelections(selections);
    }
    setValue(text) {
        this.e.setValue(text);
    }
    getValue() {
        return this.e.getValue();
    }
    offsetToPos(offset) {
        return this.e.offsetToPos(offset);
    }
    posToOffset(pos) {
        return this.e.posToOffset(pos);
    }
    fold(n) {
        const { view } = this;
        const l = view.lineBlockAt(view.state.doc.line(n + 1).from);
        const range = language.foldable(view.state, l.from, l.to);
        if (!range || range.from === range.to) {
            return;
        }
        view.dispatch({ effects: [language.foldEffect.of(range)] });
    }
    unfold(n) {
        const { view } = this;
        const l = view.lineBlockAt(view.state.doc.line(n + 1).from);
        const range = foldInside(view, l.from, l.to);
        if (!range) {
            return;
        }
        view.dispatch({ effects: [language.unfoldEffect.of(range)] });
    }
    getAllFoldedLines() {
        const c = language.foldedRanges(this.view.state).iter();
        const res = [];
        while (c.value) {
            res.push(this.offsetToPos(c.from).line);
            c.next();
        }
        return res;
    }
    triggerOnKeyDown(e) {
        view.runScopeHandlers(this.view, e, "editor");
    }
    getZoomRange() {
        if (!window.ObsidianZoomPlugin) {
            return null;
        }
        return window.ObsidianZoomPlugin.getZoomRange(this.e);
    }
    zoomOut() {
        if (!window.ObsidianZoomPlugin) {
            return;
        }
        window.ObsidianZoomPlugin.zoomOut(this.e);
    }
    zoomIn(line) {
        if (!window.ObsidianZoomPlugin) {
            return;
        }
        window.ObsidianZoomPlugin.zoomIn(this.e, line);
    }
    tryRefreshZoom(line) {
        if (!window.ObsidianZoomPlugin) {
            return;
        }
        if (window.ObsidianZoomPlugin.refreshZoom) {
            window.ObsidianZoomPlugin.refreshZoom(this.e);
        }
        else {
            window.ObsidianZoomPlugin.zoomIn(this.e, line);
        }
    }
}

function createKeymapRunCallback(config) {
    const check = config.check || (() => true);
    const { run } = config;
    return (view) => {
        const editor = getEditorFromState(view.state);
        if (!check(editor)) {
            return false;
        }
        const { shouldUpdate, shouldStopPropagation } = run(editor);
        return shouldUpdate || shouldStopPropagation;
    };
}

class ArrowLeftAndCtrlArrowLeftBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new MoveCursorToPreviousUnfoldedLine(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "ArrowLeft",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
                {
                    win: "c-ArrowLeft",
                    linux: "c-ArrowLeft",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

function cmpPos(a, b) {
    return a.line - b.line || a.ch - b.ch;
}
function maxPos(a, b) {
    return cmpPos(a, b) < 0 ? b : a;
}
function minPos(a, b) {
    return cmpPos(a, b) < 0 ? a : b;
}
function isRangesIntersects(a, b) {
    return cmpPos(a[1], b[0]) >= 0 && cmpPos(a[0], b[1]) <= 0;
}
function recalculateNumericBullets(root) {
    function visit(parent) {
        let index = 1;
        for (const child of parent.getChildren()) {
            if (/\d+\./.test(child.getBullet())) {
                child.replateBullet(`${index++}.`);
            }
            visit(child);
        }
    }
    visit(root);
}
let idSeq = 0;
class List {
    constructor(root, indent, bullet, optionalCheckbox, spaceAfterBullet, firstLine, foldRoot) {
        this.root = root;
        this.indent = indent;
        this.bullet = bullet;
        this.optionalCheckbox = optionalCheckbox;
        this.spaceAfterBullet = spaceAfterBullet;
        this.foldRoot = foldRoot;
        this.parent = null;
        this.children = [];
        this.notesIndent = null;
        this.lines = [];
        this.id = idSeq++;
        this.lines.push(firstLine);
    }
    getID() {
        return this.id;
    }
    getNotesIndent() {
        return this.notesIndent;
    }
    setNotesIndent(notesIndent) {
        if (this.notesIndent !== null) {
            throw new Error(`Notes indent already provided`);
        }
        this.notesIndent = notesIndent;
    }
    addLine(text) {
        if (this.notesIndent === null) {
            throw new Error(`Unable to add line, notes indent should be provided first`);
        }
        this.lines.push(text);
    }
    replaceLines(lines) {
        if (lines.length > 1 && this.notesIndent === null) {
            throw new Error(`Unable to add line, notes indent should be provided first`);
        }
        this.lines = lines;
    }
    getLineCount() {
        return this.lines.length;
    }
    getRoot() {
        return this.root;
    }
    getChildren() {
        return this.children.concat();
    }
    getLinesInfo() {
        const startLine = this.root.getContentLinesRangeOf(this)[0];
        return this.lines.map((row, i) => {
            const line = startLine + i;
            const startCh = i === 0 ? this.getContentStartCh() : this.notesIndent.length;
            const endCh = startCh + row.length;
            return {
                text: row,
                from: { line, ch: startCh },
                to: { line, ch: endCh },
            };
        });
    }
    getLines() {
        return this.lines.concat();
    }
    getFirstLineContentStart() {
        const startLine = this.root.getContentLinesRangeOf(this)[0];
        return {
            line: startLine,
            ch: this.getContentStartCh(),
        };
    }
    getFirstLineContentStartAfterCheckbox() {
        const startLine = this.root.getContentLinesRangeOf(this)[0];
        return {
            line: startLine,
            ch: this.getContentStartCh() + this.getCheckboxLength(),
        };
    }
    getLastLineContentEnd() {
        const endLine = this.root.getContentLinesRangeOf(this)[1];
        const endCh = this.lines.length === 1
            ? this.getContentStartCh() + this.lines[0].length
            : this.notesIndent.length + this.lines[this.lines.length - 1].length;
        return {
            line: endLine,
            ch: endCh,
        };
    }
    getContentEndIncludingChildren() {
        return this.getLastChild().getLastLineContentEnd();
    }
    getLastChild() {
        let lastChild = this;
        while (!lastChild.isEmpty()) {
            lastChild = lastChild.getChildren().last();
        }
        return lastChild;
    }
    getContentStartCh() {
        return this.indent.length + this.bullet.length + 1;
    }
    isFolded() {
        if (this.foldRoot) {
            return true;
        }
        if (this.parent) {
            return this.parent.isFolded();
        }
        return false;
    }
    isFoldRoot() {
        return this.foldRoot;
    }
    getTopFoldRoot() {
        let tmp = this;
        let foldRoot = null;
        while (tmp) {
            if (tmp.isFoldRoot()) {
                foldRoot = tmp;
            }
            tmp = tmp.parent;
        }
        return foldRoot;
    }
    getLevel() {
        if (!this.parent) {
            return 0;
        }
        return this.parent.getLevel() + 1;
    }
    unindentContent(from, till) {
        this.indent = this.indent.slice(0, from) + this.indent.slice(till);
        if (this.notesIndent !== null) {
            this.notesIndent =
                this.notesIndent.slice(0, from) + this.notesIndent.slice(till);
        }
        for (const child of this.children) {
            child.unindentContent(from, till);
        }
    }
    indentContent(indentPos, indentChars) {
        this.indent =
            this.indent.slice(0, indentPos) +
                indentChars +
                this.indent.slice(indentPos);
        if (this.notesIndent !== null) {
            this.notesIndent =
                this.notesIndent.slice(0, indentPos) +
                    indentChars +
                    this.notesIndent.slice(indentPos);
        }
        for (const child of this.children) {
            child.indentContent(indentPos, indentChars);
        }
    }
    getFirstLineIndent() {
        return this.indent;
    }
    getBullet() {
        return this.bullet;
    }
    getSpaceAfterBullet() {
        return this.spaceAfterBullet;
    }
    getCheckboxLength() {
        return this.optionalCheckbox.length;
    }
    replateBullet(bullet) {
        this.bullet = bullet;
    }
    getParent() {
        return this.parent;
    }
    addBeforeAll(list) {
        this.children.unshift(list);
        list.parent = this;
    }
    addAfterAll(list) {
        this.children.push(list);
        list.parent = this;
    }
    removeChild(list) {
        const i = this.children.indexOf(list);
        this.children.splice(i, 1);
        list.parent = null;
    }
    addBefore(before, list) {
        const i = this.children.indexOf(before);
        this.children.splice(i, 0, list);
        list.parent = this;
    }
    addAfter(before, list) {
        const i = this.children.indexOf(before);
        this.children.splice(i + 1, 0, list);
        list.parent = this;
    }
    getPrevSiblingOf(list) {
        const i = this.children.indexOf(list);
        return i > 0 ? this.children[i - 1] : null;
    }
    getNextSiblingOf(list) {
        const i = this.children.indexOf(list);
        return i >= 0 && i < this.children.length ? this.children[i + 1] : null;
    }
    isEmpty() {
        return this.children.length === 0;
    }
    print() {
        let res = "";
        for (let i = 0; i < this.lines.length; i++) {
            res +=
                i === 0
                    ? this.indent + this.bullet + this.spaceAfterBullet
                    : this.notesIndent;
            res += this.lines[i];
            res += "\n";
        }
        for (const child of this.children) {
            res += child.print();
        }
        return res;
    }
    clone(newRoot) {
        const clone = new List(newRoot, this.indent, this.bullet, this.optionalCheckbox, this.spaceAfterBullet, "", this.foldRoot);
        clone.id = this.id;
        clone.lines = this.lines.concat();
        clone.notesIndent = this.notesIndent;
        for (const child of this.children) {
            clone.addAfterAll(child.clone(newRoot));
        }
        return clone;
    }
}
class Root {
    constructor(start, end, selections) {
        this.start = start;
        this.end = end;
        this.rootList = new List(this, "", "", "", "", "", false);
        this.selections = [];
        this.replaceSelections(selections);
    }
    getRootList() {
        return this.rootList;
    }
    getContentRange() {
        return [this.getContentStart(), this.getContentEnd()];
    }
    getContentStart() {
        return Object.assign({}, this.start);
    }
    getContentEnd() {
        return Object.assign({}, this.end);
    }
    getSelections() {
        return this.selections.map((s) => ({
            anchor: Object.assign({}, s.anchor),
            head: Object.assign({}, s.head),
        }));
    }
    hasSingleCursor() {
        if (!this.hasSingleSelection()) {
            return false;
        }
        const selection = this.selections[0];
        return (selection.anchor.line === selection.head.line &&
            selection.anchor.ch === selection.head.ch);
    }
    hasSingleSelection() {
        return this.selections.length === 1;
    }
    getSelection() {
        const selection = this.selections[this.selections.length - 1];
        const from = selection.anchor.ch > selection.head.ch
            ? selection.head.ch
            : selection.anchor.ch;
        const to = selection.anchor.ch > selection.head.ch
            ? selection.anchor.ch
            : selection.head.ch;
        return Object.assign(Object.assign({}, selection), { from,
            to });
    }
    getCursor() {
        return Object.assign({}, this.selections[this.selections.length - 1].head);
    }
    replaceCursor(cursor) {
        this.selections = [{ anchor: cursor, head: cursor }];
    }
    replaceSelections(selections) {
        if (selections.length < 1) {
            throw new Error(`Unable to create Root without selections`);
        }
        this.selections = selections;
    }
    getListUnderCursor() {
        return this.getListUnderLine(this.getCursor().line);
    }
    getListUnderLine(line) {
        if (line < this.start.line || line > this.end.line) {
            return;
        }
        let result = null;
        let index = this.start.line;
        const visitArr = (ll) => {
            for (const l of ll) {
                const listFromLine = index;
                const listTillLine = listFromLine + l.getLineCount() - 1;
                if (line >= listFromLine && line <= listTillLine) {
                    result = l;
                }
                else {
                    index = listTillLine + 1;
                    visitArr(l.getChildren());
                }
                if (result !== null) {
                    return;
                }
            }
        };
        visitArr(this.rootList.getChildren());
        return result;
    }
    getContentLinesRangeOf(list) {
        let result = null;
        let line = this.start.line;
        const visitArr = (ll) => {
            for (const l of ll) {
                const listFromLine = line;
                const listTillLine = listFromLine + l.getLineCount() - 1;
                if (l === list) {
                    result = [listFromLine, listTillLine];
                }
                else {
                    line = listTillLine + 1;
                    visitArr(l.getChildren());
                }
                if (result !== null) {
                    return;
                }
            }
        };
        visitArr(this.rootList.getChildren());
        return result;
    }
    getChildren() {
        return this.rootList.getChildren();
    }
    print() {
        let res = "";
        for (const child of this.rootList.getChildren()) {
            res += child.print();
        }
        return res.replace(/\n$/, "");
    }
    clone() {
        const clone = new Root(Object.assign({}, this.start), Object.assign({}, this.end), this.getSelections());
        clone.rootList = this.rootList.clone(clone);
        return clone;
    }
}

class DeleteTillPreviousLineContentEnd {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = root.getListUnderCursor();
        const cursor = root.getCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => cursor.ch === l.from.ch && cursor.line === l.from.line);
        if (lineNo === 0) {
            this.mergeWithPreviousItem(root, cursor, list);
        }
        else if (lineNo > 0) {
            this.mergeNotes(root, cursor, list, lines, lineNo);
        }
    }
    mergeNotes(root, cursor, list, lines, lineNo) {
        this.stopPropagation = true;
        this.updated = true;
        const prevLineNo = lineNo - 1;
        root.replaceCursor({
            line: cursor.line - 1,
            ch: lines[prevLineNo].text.length + lines[prevLineNo].from.ch,
        });
        lines[prevLineNo].text += lines[lineNo].text;
        lines.splice(lineNo, 1);
        list.replaceLines(lines.map((l) => l.text));
    }
    mergeWithPreviousItem(root, cursor, list) {
        if (root.getChildren()[0] === list && list.isEmpty()) {
            return;
        }
        this.stopPropagation = true;
        const prev = root.getListUnderLine(cursor.line - 1);
        if (!prev) {
            return;
        }
        const bothAreEmpty = prev.isEmpty() && list.isEmpty();
        const prevIsEmptyAndSameLevel = prev.isEmpty() && !list.isEmpty() && prev.getLevel() === list.getLevel();
        const listIsEmptyAndPrevIsParent = list.isEmpty() && prev.getLevel() === list.getLevel() - 1;
        if (bothAreEmpty || prevIsEmptyAndSameLevel || listIsEmptyAndPrevIsParent) {
            this.updated = true;
            const parent = list.getParent();
            const prevEnd = prev.getLastLineContentEnd();
            if (!prev.getNotesIndent() && list.getNotesIndent()) {
                prev.setNotesIndent(prev.getFirstLineIndent() +
                    list.getNotesIndent().slice(list.getFirstLineIndent().length));
            }
            const oldLines = prev.getLines();
            const newLines = list.getLines();
            oldLines[oldLines.length - 1] += newLines[0];
            const resultLines = oldLines.concat(newLines.slice(1));
            prev.replaceLines(resultLines);
            parent.removeChild(list);
            for (const c of list.getChildren()) {
                list.removeChild(c);
                prev.addAfterAll(c);
            }
            root.replaceCursor(prevEnd);
            recalculateNumericBullets(root);
        }
    }
}

class BackspaceBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new DeleteTillPreviousLineContentEnd(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "Backspace",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

const BETTER_LISTS_BODY_CLASS = "outliner-plugin-better-lists";
class BetterListsStyles {
    constructor(settings, obsidianSettings) {
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.updateBodyClass = () => {
            const shouldExists = this.obsidianSettings.isDefaultThemeEnabled() &&
                this.settings.betterListsStyles;
            const exists = document.body.classList.contains(BETTER_LISTS_BODY_CLASS);
            if (shouldExists && !exists) {
                document.body.classList.add(BETTER_LISTS_BODY_CLASS);
            }
            if (!shouldExists && exists) {
                document.body.classList.remove(BETTER_LISTS_BODY_CLASS);
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateBodyClass();
            this.updateBodyClassInterval = window.setInterval(() => {
                this.updateBodyClass();
            }, 1000);
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.updateBodyClassInterval);
            document.body.classList.remove(BETTER_LISTS_BODY_CLASS);
        });
    }
}

class SelectAllContent {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleSelection()) {
            return;
        }
        const selection = root.getSelections()[0];
        const [rootStart, rootEnd] = root.getContentRange();
        const selectionFrom = minPos(selection.anchor, selection.head);
        const selectionTo = maxPos(selection.anchor, selection.head);
        if (selectionFrom.line < rootStart.line ||
            selectionTo.line > rootEnd.line) {
            return false;
        }
        if (selectionFrom.line === rootStart.line &&
            selectionFrom.ch === rootStart.ch &&
            selectionTo.line === rootEnd.line &&
            selectionTo.ch === rootEnd.ch) {
            return false;
        }
        const list = root.getListUnderCursor();
        const contentStart = list.getFirstLineContentStartAfterCheckbox();
        const contentEnd = list.getLastLineContentEnd();
        if (selectionFrom.line < contentStart.line ||
            selectionTo.line > contentEnd.line) {
            return false;
        }
        this.stopPropagation = true;
        this.updated = true;
        if (selectionFrom.line === contentStart.line &&
            selectionFrom.ch === contentStart.ch &&
            selectionTo.line === contentEnd.line &&
            selectionTo.ch === contentEnd.ch) {
            // select whole list
            root.replaceSelections([{ anchor: rootStart, head: rootEnd }]);
        }
        else {
            // select whole line
            root.replaceSelections([{ anchor: contentStart, head: contentEnd }]);
        }
        return true;
    }
}

class CtrlAAndCmdABehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.overrideSelectAllBehaviour && !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new SelectAllContent(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "c-a",
                    mac: "m-a",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class DeleteTillNextLineContentStart {
    constructor(root) {
        this.root = root;
        this.deleteTillPreviousLineContentEnd =
            new DeleteTillPreviousLineContentEnd(root);
    }
    shouldStopPropagation() {
        return this.deleteTillPreviousLineContentEnd.shouldStopPropagation();
    }
    shouldUpdate() {
        return this.deleteTillPreviousLineContentEnd.shouldUpdate();
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = root.getListUnderCursor();
        const cursor = root.getCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => cursor.ch === l.to.ch && cursor.line === l.to.line);
        if (lineNo === lines.length - 1) {
            const nextLine = lines[lineNo].to.line + 1;
            const nextList = root.getListUnderLine(nextLine);
            if (!nextList) {
                return;
            }
            root.replaceCursor(nextList.getFirstLineContentStart());
            this.deleteTillPreviousLineContentEnd.perform();
        }
        else if (lineNo >= 0) {
            root.replaceCursor(lines[lineNo + 1].from);
            this.deleteTillPreviousLineContentEnd.perform();
        }
    }
}

class DeleteBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new DeleteTillNextLineContentStart(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "Delete",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class MoveListToDifferentPosition {
    constructor(root, listToMove, placeToMove, whereToMove, defaultIndentChars) {
        this.root = root;
        this.listToMove = listToMove;
        this.placeToMove = placeToMove;
        this.whereToMove = whereToMove;
        this.defaultIndentChars = defaultIndentChars;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        if (this.listToMove === this.placeToMove) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        const cursorAnchor = this.calculateCursorAnchor();
        this.moveList();
        this.changeIndent();
        this.restoreCursor(cursorAnchor);
        recalculateNumericBullets(this.root);
    }
    calculateCursorAnchor() {
        const cursorLine = this.root.getCursor().line;
        const lines = [
            this.listToMove.getFirstLineContentStart().line,
            this.listToMove.getLastLineContentEnd().line,
            this.placeToMove.getFirstLineContentStart().line,
            this.placeToMove.getLastLineContentEnd().line,
        ];
        const listStartLine = Math.min(...lines);
        const listEndLine = Math.max(...lines);
        if (cursorLine < listStartLine || cursorLine > listEndLine) {
            return null;
        }
        const cursor = this.root.getCursor();
        const cursorList = this.root.getListUnderLine(cursor.line);
        const cursorListStart = cursorList.getFirstLineContentStart();
        const lineDiff = cursor.line - cursorListStart.line;
        const chDiff = cursor.ch - cursorListStart.ch;
        return { cursorList, lineDiff, chDiff };
    }
    moveList() {
        this.listToMove.getParent().removeChild(this.listToMove);
        switch (this.whereToMove) {
            case "before":
                this.placeToMove
                    .getParent()
                    .addBefore(this.placeToMove, this.listToMove);
                break;
            case "after":
                this.placeToMove
                    .getParent()
                    .addAfter(this.placeToMove, this.listToMove);
                break;
            case "inside":
                this.placeToMove.addBeforeAll(this.listToMove);
                break;
        }
    }
    changeIndent() {
        const oldIndent = this.listToMove.getFirstLineIndent();
        const newIndent = this.whereToMove === "inside"
            ? this.placeToMove.getFirstLineIndent() + this.defaultIndentChars
            : this.placeToMove.getFirstLineIndent();
        this.listToMove.unindentContent(0, oldIndent.length);
        this.listToMove.indentContent(0, newIndent);
    }
    restoreCursor(cursorAnchor) {
        if (cursorAnchor) {
            const cursorListStart = cursorAnchor.cursorList.getFirstLineContentStart();
            this.root.replaceCursor({
                line: cursorListStart.line + cursorAnchor.lineDiff,
                ch: cursorListStart.ch + cursorAnchor.chDiff,
            });
        }
        else {
            // When you move a list, the screen scrolls to the cursor.
            // It is better to move the cursor into the viewport than let the screen scroll.
            this.root.replaceCursor(this.listToMove.getLastLineContentEnd());
        }
    }
}

const BODY_CLASS = "outliner-plugin-dnd";
class DragAndDrop {
    constructor(plugin, settings, obisidian, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.obisidian = obisidian;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.preStart = null;
        this.state = null;
        this.handleSettingsChange = () => {
            if (!isFeatureSupported()) {
                return;
            }
            if (this.settings.dragAndDrop) {
                document.body.classList.add(BODY_CLASS);
            }
            else {
                document.body.classList.remove(BODY_CLASS);
            }
        };
        this.handleMouseDown = (e) => {
            if (!isFeatureSupported() ||
                !this.settings.dragAndDrop ||
                !isClickOnBullet(e)) {
                return;
            }
            const view = getEditorViewFromHTMLElement(e.target);
            if (!view) {
                return;
            }
            this.preStart = {
                x: e.x,
                y: e.y,
                view,
            };
        };
        this.handleMouseMove = (e) => {
            if (this.preStart) {
                this.startDragging();
            }
            if (this.state) {
                this.detectAndDrawDropZone(e.x, e.y);
            }
        };
        this.handleMouseUp = () => {
            if (this.preStart) {
                this.preStart = null;
            }
            if (this.state) {
                this.stopDragging();
            }
        };
        this.handleKeyDown = (e) => {
            if (this.state && e.code === "Escape") {
                this.cancelDragging();
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(dndStateField);
            this.enableFeatureToggle();
            this.createDropZone();
            this.addEventListeners();
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeEventListeners();
            this.removeDropZone();
            this.disableFeatureToggle();
        });
    }
    enableFeatureToggle() {
        this.settings.onChange(this.handleSettingsChange);
        this.handleSettingsChange();
    }
    disableFeatureToggle() {
        this.settings.removeCallback(this.handleSettingsChange);
        document.body.classList.remove(BODY_CLASS);
    }
    createDropZone() {
        this.dropZone = document.createElement("div");
        this.dropZone.classList.add("outliner-plugin-drop-zone");
        this.dropZone.style.display = "none";
        document.body.appendChild(this.dropZone);
    }
    removeDropZone() {
        document.body.removeChild(this.dropZone);
        this.dropZone = null;
    }
    addEventListeners() {
        document.addEventListener("mousedown", this.handleMouseDown, {
            capture: true,
        });
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("keydown", this.handleKeyDown);
    }
    removeEventListeners() {
        document.removeEventListener("mousedown", this.handleMouseDown, {
            capture: true,
        });
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("keydown", this.handleKeyDown);
    }
    startDragging() {
        const { x, y, view } = this.preStart;
        this.preStart = null;
        const editor = getEditorFromState(view.state);
        const pos = editor.offsetToPos(view.posAtCoords({ x, y }));
        const root = this.parser.parse(editor, pos);
        const list = root.getListUnderLine(pos.line);
        const state = new DragAndDropState(view, editor, root, list);
        if (!state.hasDropVariants()) {
            return;
        }
        this.state = state;
        this.highlightDraggingLines();
    }
    detectAndDrawDropZone(x, y) {
        this.state.calculateNearestDropVariant(x, y);
        this.drawDropZone();
    }
    cancelDragging() {
        this.state.dropVariant = null;
        this.stopDragging();
    }
    stopDragging() {
        this.unhightlightDraggingLines();
        this.hideDropZone();
        this.applyChanges();
        this.state = null;
    }
    applyChanges() {
        if (!this.state.dropVariant) {
            return;
        }
        const { state } = this;
        const { dropVariant, editor, root, list } = state;
        const newRoot = this.parser.parse(editor, root.getContentStart());
        if (!isSameRoots(root, newRoot)) {
            new obsidian.Notice(`The item cannot be moved. The page content changed during the move.`, 5000);
            return;
        }
        this.operationPerformer.eval(root, new MoveListToDifferentPosition(root, list, dropVariant.placeToMove, dropVariant.whereToMove, this.obisidian.getDefaultIndentChars()), editor);
    }
    highlightDraggingLines() {
        const { state } = this;
        const { list, editor, view } = state;
        const lines = [];
        const fromLine = list.getFirstLineContentStart().line;
        const tillLine = list.getContentEndIncludingChildren().line;
        for (let i = fromLine; i <= tillLine; i++) {
            lines.push(editor.posToOffset({ line: i, ch: 0 }));
        }
        view.dispatch({
            effects: [dndStarted.of(lines)],
        });
        document.body.classList.add("outliner-plugin-dragging");
    }
    unhightlightDraggingLines() {
        document.body.classList.remove("outliner-plugin-dragging");
        this.state.view.dispatch({
            effects: [dndEnded.of()],
        });
    }
    drawDropZone() {
        const { state } = this;
        const { view, editor, list, dropVariant } = state;
        const width = Math.round(view.contentDOM.offsetWidth -
            (dropVariant.left -
                view.coordsAtPos(editor.posToOffset({
                    line: list.getFirstLineContentStart().line,
                    ch: 0,
                })).left));
        this.dropZone.style.display = "block";
        this.dropZone.style.top = dropVariant.top + "px";
        this.dropZone.style.left = dropVariant.left + "px";
        this.dropZone.style.width = width + "px";
        if (dropVariant.whereToMove === "before" &&
            !this.dropZone.classList.contains("outliner-plugin-drop-zone-before")) {
            this.dropZone.classList.remove("outliner-plugin-drop-zone-after");
            this.dropZone.classList.add("outliner-plugin-drop-zone-before");
        }
        else if ((dropVariant.whereToMove === "after" ||
            dropVariant.whereToMove === "inside") &&
            !this.dropZone.classList.contains("outliner-plugin-drop-zone-after")) {
            this.dropZone.classList.remove("outliner-plugin-drop-zone-before");
            this.dropZone.classList.add("outliner-plugin-drop-zone-after");
        }
    }
    hideDropZone() {
        this.dropZone.style.display = "none";
    }
}
class DragAndDropState {
    constructor(view, editor, root, list) {
        this.view = view;
        this.editor = editor;
        this.root = root;
        this.list = list;
        this.dropVariants = new Map();
        this.dropVariant = null;
        this.collectDropVariants();
    }
    getDropVariants() {
        return Array.from(this.dropVariants.values());
    }
    hasDropVariants() {
        return this.dropVariants.size > 0;
    }
    calculateNearestDropVariant(x, y) {
        const { view, editor } = this;
        this.dropVariant = this.getDropVariants()
            .map((v) => {
            const { placeToMove } = v;
            switch (v.whereToMove) {
                case "before":
                case "after":
                    v.left = Math.round(view.coordsAtPos(editor.posToOffset({
                        line: placeToMove.getFirstLineContentStart().line,
                        ch: placeToMove.getFirstLineIndent().length,
                    })).left);
                    break;
                case "inside":
                    v.left = Math.round(view.coordsAtPos(editor.posToOffset({
                        line: placeToMove.getFirstLineContentStart().line,
                        ch: placeToMove.getFirstLineIndent().length,
                    })).left +
                        view.defaultCharacterWidth * 2);
                    break;
            }
            switch (v.whereToMove) {
                case "before":
                    v.top = Math.round(view.coordsAtPos(editor.posToOffset(placeToMove.getFirstLineContentStart())).top);
                    break;
                case "after":
                case "inside":
                    v.top = Math.round(view.coordsAtPos(editor.posToOffset(placeToMove.getContentEndIncludingChildren())).top + view.defaultLineHeight);
                    break;
            }
            return v;
        })
            .sort((a, b) => {
            if (a.top === b.top) {
                return Math.abs(x - a.left) - Math.abs(x - b.left);
            }
            return Math.abs(y - a.top) - Math.abs(y - b.top);
        })
            .first();
    }
    addDropVariant(v) {
        this.dropVariants.set(`${v.line} ${v.level}`, v);
    }
    collectDropVariants() {
        const visit = (lists) => {
            for (const placeToMove of lists) {
                const lineBefore = placeToMove.getFirstLineContentStart().line;
                const lineAfter = placeToMove.getContentEndIncludingChildren().line + 1;
                const level = placeToMove.getLevel();
                this.addDropVariant({
                    line: lineBefore,
                    level,
                    left: 0,
                    top: 0,
                    placeToMove,
                    whereToMove: "before",
                });
                this.addDropVariant({
                    line: lineAfter,
                    level,
                    left: 0,
                    top: 0,
                    placeToMove,
                    whereToMove: "after",
                });
                if (placeToMove.isEmpty()) {
                    this.addDropVariant({
                        line: lineAfter,
                        level: level + 1,
                        left: 0,
                        top: 0,
                        placeToMove,
                        whereToMove: "inside",
                    });
                }
                if (placeToMove !== this.list) {
                    visit(placeToMove.getChildren());
                }
            }
        };
        visit(this.root.getChildren());
    }
}
const dndStarted = state.StateEffect.define({
    map: (lines, change) => lines.map((l) => change.mapPos(l)),
});
const dndEnded = state.StateEffect.define();
const draggingLineDecoration = view.Decoration.line({
    class: "outliner-plugin-dragging-line",
});
const dndStateField = state.StateField.define({
    create: () => view.Decoration.none,
    update: (dndState, tr) => {
        dndState = dndState.map(tr.changes);
        for (const e of tr.effects) {
            if (e.is(dndStarted)) {
                dndState = dndState.update({
                    add: e.value.map((l) => draggingLineDecoration.range(l, l)),
                });
            }
            if (e.is(dndEnded)) {
                dndState = view.Decoration.none;
            }
        }
        return dndState;
    },
    provide: (f) => view.EditorView.decorations.from(f),
});
function getEditorViewFromHTMLElement(e) {
    while (e && !e.classList.contains("cm-editor")) {
        e = e.parentElement;
    }
    if (!e) {
        return null;
    }
    return view.EditorView.findFromDOM(e);
}
function isClickOnBullet(e) {
    let el = e.target;
    while (el) {
        if (el.classList.contains("cm-formatting-list") ||
            el.classList.contains("cm-fold-indicator") ||
            el.classList.contains("task-list-item-checkbox")) {
            return true;
        }
        el = el.parentElement;
    }
    return false;
}
function isSameRoots(a, b) {
    const [aStart, aEnd] = a.getContentRange();
    const [bStart, bEnd] = b.getContentRange();
    if (cmpPos(aStart, bStart) !== 0 || cmpPos(aEnd, bEnd) !== 0) {
        return false;
    }
    return a.print() === b.print();
}
function isFeatureSupported() {
    return obsidian.Platform.isDesktop;
}

class KeepCursorOutsideFoldedLines {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const cursor = root.getCursor();
        const list = root.getListUnderCursor();
        if (!list.isFolded()) {
            return;
        }
        const foldRoot = list.getTopFoldRoot();
        const firstLineEnd = foldRoot.getLinesInfo()[0].to;
        if (cursor.line > firstLineEnd.line) {
            this.updated = true;
            this.stopPropagation = true;
            root.replaceCursor(firstLineEnd);
        }
    }
}

class KeepCursorWithinListContent {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const cursor = root.getCursor();
        const list = root.getListUnderCursor();
        const contentStart = list.getFirstLineContentStartAfterCheckbox();
        const linePrefix = contentStart.line === cursor.line
            ? contentStart.ch
            : list.getNotesIndent().length;
        if (cursor.ch < linePrefix) {
            this.updated = true;
            this.stopPropagation = true;
            root.replaceCursor({
                line: cursor.line,
                ch: linePrefix,
            });
        }
    }
}

class EditorSelectionsBehaviourOverride {
    constructor(plugin, settings, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.transactionExtender = (tr) => {
            if (this.settings.keepCursorWithinContent === "never" || !tr.selection) {
                return null;
            }
            const editor = getEditorFromState(tr.startState);
            setTimeout(() => {
                this.handleSelectionsChanges(editor);
            }, 0);
            return null;
        };
        this.handleSelectionsChanges = (editor) => {
            const root = this.parser.parse(editor);
            if (!root) {
                return;
            }
            {
                const { shouldStopPropagation } = this.operationPerformer.eval(root, new KeepCursorOutsideFoldedLines(root), editor);
                if (shouldStopPropagation) {
                    return;
                }
            }
            this.operationPerformer.eval(root, new KeepCursorWithinListContent(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.EditorState.transactionExtender.of(this.transactionExtender));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

const checkboxRe = `\\[[^\\[\\]]\\][ \t]`;

function isEmptyLineOrEmptyCheckbox(line) {
    return line === "" || line === "[ ] ";
}

class CreateNewItem {
    constructor(root, defaultIndentChars, getZoomRange) {
        this.root = root;
        this.defaultIndentChars = defaultIndentChars;
        this.getZoomRange = getZoomRange;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleSelection()) {
            return;
        }
        const selection = root.getSelection();
        if (!selection || selection.anchor.line !== selection.head.line) {
            return;
        }
        const list = root.getListUnderCursor();
        const lines = list.getLinesInfo();
        if (lines.length === 1 && isEmptyLineOrEmptyCheckbox(lines[0].text)) {
            return;
        }
        const cursor = root.getCursor();
        const lineUnderCursor = lines.find((l) => l.from.line === cursor.line);
        if (cursor.ch < lineUnderCursor.from.ch) {
            return;
        }
        const { oldLines, newLines } = lines.reduce((acc, line) => {
            if (cursor.line > line.from.line) {
                acc.oldLines.push(line.text);
            }
            else if (cursor.line === line.from.line) {
                const left = line.text.slice(0, selection.from - line.from.ch);
                const right = line.text.slice(selection.to - line.from.ch);
                acc.oldLines.push(left);
                acc.newLines.push(right);
            }
            else if (cursor.line < line.from.line) {
                acc.newLines.push(line.text);
            }
            return acc;
        }, {
            oldLines: [],
            newLines: [],
        });
        const codeBlockBacticks = oldLines.join("\n").split("```").length - 1;
        const isInsideCodeblock = codeBlockBacticks > 0 && codeBlockBacticks % 2 !== 0;
        if (isInsideCodeblock) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        const zoomRange = this.getZoomRange.getZoomRange();
        const listIsZoomingRoot = Boolean(zoomRange &&
            list.getFirstLineContentStart().line >= zoomRange.from.line &&
            list.getLastLineContentEnd().line <= zoomRange.from.line);
        const hasChildren = !list.isEmpty();
        const childIsFolded = list.isFoldRoot();
        const endPos = list.getLastLineContentEnd();
        const endOfLine = cursor.line === endPos.line && cursor.ch === endPos.ch;
        const onChildLevel = listIsZoomingRoot || (hasChildren && !childIsFolded && endOfLine);
        const indent = onChildLevel
            ? hasChildren
                ? list.getChildren()[0].getFirstLineIndent()
                : list.getFirstLineIndent() + this.defaultIndentChars
            : list.getFirstLineIndent();
        const bullet = onChildLevel && hasChildren
            ? list.getChildren()[0].getBullet()
            : list.getBullet();
        const spaceAfterBullet = onChildLevel && hasChildren
            ? list.getChildren()[0].getSpaceAfterBullet()
            : list.getSpaceAfterBullet();
        const prefix = oldLines[0].match(checkboxRe) ? "[ ] " : "";
        const newList = new List(list.getRoot(), indent, bullet, prefix, spaceAfterBullet, prefix + newLines.shift(), false);
        if (newLines.length > 0) {
            newList.setNotesIndent(list.getNotesIndent());
            for (const line of newLines) {
                newList.addLine(line);
            }
        }
        if (onChildLevel) {
            list.addBeforeAll(newList);
        }
        else {
            if (!childIsFolded || !endOfLine) {
                const children = list.getChildren();
                for (const child of children) {
                    list.removeChild(child);
                    newList.addAfterAll(child);
                }
            }
            list.getParent().addAfter(list, newList);
        }
        list.replaceLines(oldLines);
        const newListStart = newList.getFirstLineContentStart();
        root.replaceCursor({
            line: newListStart.line,
            ch: newListStart.ch + prefix.length,
        });
        recalculateNumericBullets(root);
    }
}

class OutdentList {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const grandParent = parent.getParent();
        if (!grandParent) {
            return;
        }
        this.updated = true;
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        const indentRmFrom = parent.getFirstLineIndent().length;
        const indentRmTill = list.getFirstLineIndent().length;
        parent.removeChild(list);
        grandParent.addAfter(parent, list);
        list.unindentContent(indentRmFrom, indentRmTill);
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const chDiff = indentRmTill - indentRmFrom;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch - chDiff,
        });
        recalculateNumericBullets(root);
    }
}

class OutdentListIfItsEmpty {
    constructor(root) {
        this.root = root;
        this.outdentList = new OutdentList(root);
    }
    shouldStopPropagation() {
        return this.outdentList.shouldStopPropagation();
    }
    shouldUpdate() {
        return this.outdentList.shouldUpdate();
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = root.getListUnderCursor();
        const lines = list.getLines();
        if (lines.length > 1 ||
            !isEmptyLineOrEmptyCheckbox(lines[0]) ||
            list.getLevel() === 1) {
            return;
        }
        this.outdentList.perform();
    }
}

class EnterBehaviourOverride {
    constructor(plugin, settings, imeDetector, obsidianSettings, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return this.settings.overrideEnterBehaviour && !this.imeDetector.isOpened();
        };
        this.run = (editor) => {
            const root = this.parser.parse(editor);
            if (!root) {
                return {
                    shouldUpdate: false,
                    shouldStopPropagation: false,
                };
            }
            {
                const res = this.operationPerformer.eval(root, new OutdentListIfItsEmpty(root), editor);
                if (res.shouldStopPropagation) {
                    return res;
                }
            }
            {
                const defaultIndentChars = this.obsidianSettings.getDefaultIndentChars();
                const zoomRange = editor.getZoomRange();
                const getZoomRange = {
                    getZoomRange: () => zoomRange,
                };
                const res = this.operationPerformer.eval(root, new CreateNewItem(root, defaultIndentChars, getZoomRange), editor);
                if (res.shouldUpdate && zoomRange) {
                    editor.tryRefreshZoom(zoomRange.from.line);
                }
                return res;
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.Prec.highest(view.keymap.of([
                {
                    key: "Enter",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ])));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

function createEditorCallback(cb) {
    return (editor) => {
        const myEditor = new MyEditor(editor);
        const shouldStopPropagation = cb(myEditor);
        if (!shouldStopPropagation &&
            window.event &&
            window.event.type === "keydown") {
            myEditor.triggerOnKeyDown(window.event);
        }
    };
}

class ListsFoldingCommands {
    constructor(plugin, obsidianSettings) {
        this.plugin = plugin;
        this.obsidianSettings = obsidianSettings;
        this.fold = (editor) => {
            return this.setFold(editor, "fold");
        };
        this.unfold = (editor) => {
            return this.setFold(editor, "unfold");
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addCommand({
                id: "fold",
                icon: "chevrons-down-up",
                name: "Fold the list",
                editorCallback: createEditorCallback(this.fold),
                hotkeys: [
                    {
                        modifiers: ["Mod"],
                        key: "ArrowUp",
                    },
                ],
            });
            this.plugin.addCommand({
                id: "unfold",
                icon: "chevrons-up-down",
                name: "Unfold the list",
                editorCallback: createEditorCallback(this.unfold),
                hotkeys: [
                    {
                        modifiers: ["Mod"],
                        key: "ArrowDown",
                    },
                ],
            });
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    setFold(editor, type) {
        if (!this.obsidianSettings.getFoldSettings().foldIndent) {
            new obsidian.Notice(`Unable to ${type} because folding is disabled. Please enable "Fold indent" in Obsidian settings.`, 5000);
            return true;
        }
        const cursor = editor.getCursor();
        if (type === "fold") {
            editor.fold(cursor.line);
        }
        else {
            editor.unfold(cursor.line);
        }
        return true;
    }
}

class IndentList {
    constructor(root, defaultIndentChars) {
        this.root = root;
        this.defaultIndentChars = defaultIndentChars;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const prev = parent.getPrevSiblingOf(list);
        if (!prev) {
            return;
        }
        this.updated = true;
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        const indentPos = list.getFirstLineIndent().length;
        let indentChars = "";
        if (indentChars === "" && !prev.isEmpty()) {
            indentChars = prev
                .getChildren()[0]
                .getFirstLineIndent()
                .slice(prev.getFirstLineIndent().length);
        }
        if (indentChars === "") {
            indentChars = list
                .getFirstLineIndent()
                .slice(parent.getFirstLineIndent().length);
        }
        if (indentChars === "" && !list.isEmpty()) {
            indentChars = list.getChildren()[0].getFirstLineIndent();
        }
        if (indentChars === "") {
            indentChars = this.defaultIndentChars;
        }
        parent.removeChild(list);
        prev.addAfterAll(list);
        list.indentContent(indentPos, indentChars);
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch + indentChars.length,
        });
        recalculateNumericBullets(root);
    }
}

class MoveListDown {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const grandParent = parent.getParent();
        const next = parent.getNextSiblingOf(list);
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        if (!next && grandParent) {
            const newParent = grandParent.getNextSiblingOf(parent);
            if (newParent) {
                this.updated = true;
                parent.removeChild(list);
                newParent.addBeforeAll(list);
            }
        }
        else if (next) {
            this.updated = true;
            parent.removeChild(list);
            parent.addAfter(next, list);
        }
        if (!this.updated) {
            return;
        }
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch,
        });
        recalculateNumericBullets(root);
    }
}

class MoveListUp {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const grandParent = parent.getParent();
        const prev = parent.getPrevSiblingOf(list);
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        if (!prev && grandParent) {
            const newParent = grandParent.getPrevSiblingOf(parent);
            if (newParent) {
                this.updated = true;
                parent.removeChild(list);
                newParent.addAfterAll(list);
            }
        }
        else if (prev) {
            this.updated = true;
            parent.removeChild(list);
            parent.addBefore(prev, list);
        }
        if (!this.updated) {
            return;
        }
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch,
        });
        recalculateNumericBullets(root);
    }
}

class ListsMovementCommands {
    constructor(plugin, obsidianSettings, operationPerformer) {
        this.plugin = plugin;
        this.obsidianSettings = obsidianSettings;
        this.operationPerformer = operationPerformer;
        this.moveListDown = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new MoveListDown(root), editor);
            return shouldStopPropagation;
        };
        this.moveListUp = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new MoveListUp(root), editor);
            return shouldStopPropagation;
        };
        this.indentList = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new IndentList(root, this.obsidianSettings.getDefaultIndentChars()), editor);
            return shouldStopPropagation;
        };
        this.outdentList = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new OutdentList(root), editor);
            return shouldStopPropagation;
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addCommand({
                id: "move-list-item-up",
                icon: "arrow-up",
                name: "Move list and sublists up",
                editorCallback: createEditorCallback(this.moveListUp),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "ArrowUp",
                    },
                ],
            });
            this.plugin.addCommand({
                id: "move-list-item-down",
                icon: "arrow-down",
                name: "Move list and sublists down",
                editorCallback: createEditorCallback(this.moveListDown),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "ArrowDown",
                    },
                ],
            });
            this.plugin.addCommand({
                id: "indent-list",
                icon: "indent",
                name: "Indent the list and sublists",
                editorCallback: createEditorCallback(this.indentList),
                hotkeys: [],
            });
            this.plugin.addCommand({
                id: "outdent-list",
                icon: "outdent",
                name: "Outdent the list and sublists",
                editorCallback: createEditorCallback(this.outdentList),
                hotkeys: [],
            });
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class DeleteTillCurrentLineContentStart {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        const cursor = root.getCursor();
        const list = root.getListUnderCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => l.from.line === cursor.line);
        lines[lineNo].text = lines[lineNo].text.slice(cursor.ch - lines[lineNo].from.ch);
        list.replaceLines(lines.map((l) => l.text));
        root.replaceCursor(lines[lineNo].from);
    }
}

class MetaBackspaceBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new DeleteTillCurrentLineContentStart(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    mac: "m-Backspace",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class ReleaseNotesModal extends obsidian.Modal {
    constructor(plugin, title, content, cb) {
        super(plugin.app);
        this.plugin = plugin;
        this.title = title;
        this.content = content;
        this.cb = cb;
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            this.titleEl.setText(this.title);
            obsidian.MarkdownRenderer.renderMarkdown(this.content, this.contentEl, "", this.plugin);
        });
    }
    onClose() {
        this.cb();
    }
}
function compareReleases(a, b) {
    const [aMajor, aMinor, aPatch] = a.split(".", 3).map(Number);
    const [bMajor, bMinor, bPatch] = b.split(".", 3).map(Number);
    if (aMajor === bMajor) {
        if (aMinor === bMinor) {
            return aPatch - bPatch;
        }
        return aMinor - bMinor;
    }
    return aMajor - bMajor;
}
function parseChangelog() {
    const markdown = "## 4.5.0\n\n### Drag-and-Drop (Experimental)\n\nNow you can drag and drop items using your mouse! 🎉\n\nThis feature is experimental and is disabled by default. To enable this feature, open the plugin settings and turn on the `Drag-and-Drop (Experimental)` setting.\n\nIf you find a bug, please report the [issue](https://github.com/vslinko/obsidian-outliner/issues). Leave your other feedback [here](https://github.com/vslinko/obsidian-outliner/discussions/190).\n\n<img src=\"https://raw.githubusercontent.com/vslinko/obsidian-outliner/main/demo3.gif\" style=\"max-width: 100%\" />\n";
    const releaseNotes = [];
    let version;
    let content = "";
    for (const line of markdown.split("\n")) {
        const versionHeaderMatches = /^#+\s+(\d+\.\d+\.\d+)$/.exec(line);
        if (versionHeaderMatches) {
            if (version && content.trim().length > 0) {
                releaseNotes.push([version, content]);
            }
            version = versionHeaderMatches[1];
            content = line;
            content += "\n";
        }
        else {
            content += line;
            content += "\n";
        }
    }
    if (version && content.trim().length > 0) {
        releaseNotes.push([version, content]);
    }
    return releaseNotes;
}
class ReleaseNotesAnnouncement {
    constructor(plugin, settings) {
        this.plugin = plugin;
        this.settings = settings;
        this.modal = null;
        this.showModal = (previousRelease = null) => {
            let releaseNotes = "";
            for (const [version, content] of parseChangelog()) {
                if (compareReleases(version, previousRelease || "0.0.0") > 0) {
                    releaseNotes += content;
                }
            }
            if (releaseNotes.trim().length === 0) {
                return;
            }
            const modalTitle = `Welcome to Obsidian Outliner ${"4.6.6"}`;
            this.modal = new ReleaseNotesModal(this.plugin, modalTitle, releaseNotes, this.handleClose);
            this.modal.open();
        };
        this.handleClose = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.modal) {
                return;
            }
            this.settings.previousRelease = "4.6.6";
            yield this.settings.save();
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addCommand({
                id: "show-release-notes",
                name: "Show Release Notes",
                callback: this.showModal,
            });
            this.showModal(this.settings.previousRelease);
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.modal) {
                return;
            }
            const modal = this.modal;
            this.modal = null;
            modal.close();
        });
    }
}

class ObsidianOutlinerPluginSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin, settings) {
        super(app, plugin);
        this.settings = settings;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new obsidian.Setting(containerEl)
            .setName("Stick the cursor to the content")
            .setDesc("Don't let the cursor move to the bullet position.")
            .addDropdown((dropdown) => {
            dropdown
                .addOptions({
                never: "Never",
                "bullet-only": "Stick cursor out of bullets",
                "bullet-and-checkbox": "Stick cursor out of bullets and checkboxes",
            })
                .setValue(this.settings.keepCursorWithinContent)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.keepCursorWithinContent = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Enhance the Tab key")
            .setDesc("Make Tab and Shift-Tab behave the same as other outliners.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideTabBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideTabBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Enhance the Enter key")
            .setDesc("Make the Enter key behave the same as other outliners.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideEnterBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideEnterBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Enhance the Ctrl+A or Cmd+A behavior")
            .setDesc("Press the hotkey once to select the current list item. Press the hotkey twice to select the entire list.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideSelectAllBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideSelectAllBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Improve the style of your lists")
            .setDesc("Styles are only compatible with built-in Obsidian themes and may not be compatible with other themes.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.betterListsStyles)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.betterListsStyles = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Draw vertical indentation lines")
            .addToggle((toggle) => {
            toggle.setValue(this.settings.verticalLines).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.verticalLines = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Vertical indentation line click action")
            .addDropdown((dropdown) => {
            dropdown
                .addOptions({
                none: "None",
                "zoom-in": "Zoom In",
                "toggle-folding": "Toggle Folding",
            })
                .setValue(this.settings.verticalLinesAction)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.verticalLinesAction = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Drag-and-Drop (Experimental)")
            .addToggle((toggle) => {
            toggle.setValue(this.settings.dragAndDrop).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.dragAndDrop = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Debug mode")
            .setDesc("Open DevTools (Command+Option+I or Control+Shift+I) to copy the debug logs.")
            .addToggle((toggle) => {
            toggle.setValue(this.settings.debug).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.debug = value;
                yield this.settings.save();
            }));
        });
    }
}
class SettingsTab {
    constructor(plugin, settings) {
        this.plugin = plugin;
        this.settings = settings;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addSettingTab(new ObsidianOutlinerPluginSettingTab(this.plugin.app, this.plugin, this.settings));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class ShiftTabBehaviourOverride {
    constructor(plugin, imeDetector, settings, operationPerformer) {
        this.plugin = plugin;
        this.imeDetector = imeDetector;
        this.settings = settings;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return this.settings.overrideTabBehaviour && !this.imeDetector.isOpened();
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new OutdentList(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.Prec.highest(view.keymap.of([
                {
                    key: "s-Tab",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ])));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class TabBehaviourOverride {
    constructor(plugin, imeDetector, obsidianSettings, settings, operationPerformer) {
        this.plugin = plugin;
        this.imeDetector = imeDetector;
        this.obsidianSettings = obsidianSettings;
        this.settings = settings;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return this.settings.overrideTabBehaviour && !this.imeDetector.isOpened();
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new IndentList(root, this.obsidianSettings.getDefaultIndentChars()), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.Prec.highest(view.keymap.of([
                {
                    key: "Tab",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ])));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

const VERTICAL_LINES_BODY_CLASS = "outliner-plugin-vertical-lines";
class VerticalLinesPluginValue {
    constructor(settings, obsidianSettings, parser, view) {
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.view = view;
        this.lineElements = [];
        this.waitForEditor = () => {
            const editor = getEditorFromState(this.view.state);
            if (!editor) {
                setTimeout(this.waitForEditor, 0);
                return;
            }
            this.editor = editor;
            this.scheduleRecalculate();
        };
        this.onScroll = (e) => {
            const { scrollLeft, scrollTop } = e.target;
            this.scroller.scrollTo(scrollLeft, scrollTop);
        };
        this.scheduleRecalculate = () => {
            clearTimeout(this.scheduled);
            this.scheduled = setTimeout(this.calculate, 0);
        };
        this.calculate = () => {
            this.lines = [];
            if (this.settings.verticalLines &&
                this.obsidianSettings.isDefaultThemeEnabled() &&
                this.view.viewportLineBlocks.length > 0 &&
                this.view.visibleRanges.length > 0) {
                const fromLine = this.editor.offsetToPos(this.view.viewport.from).line;
                const toLine = this.editor.offsetToPos(this.view.viewport.to).line;
                const lists = this.parser.parseRange(this.editor, fromLine, toLine);
                for (const list of lists) {
                    this.lastLine = list.getContentEnd().line;
                    for (const c of list.getChildren()) {
                        this.recursive(c);
                    }
                }
                this.lines.sort((a, b) => a.top === b.top ? a.left - b.left : a.top - b.top);
            }
            this.updateDom();
        };
        this.onClick = (e) => {
            e.preventDefault();
            const line = this.lines[Number(e.target.dataset.index)];
            switch (this.settings.verticalLinesAction) {
                case "zoom-in":
                    this.zoomIn(line);
                    break;
                case "toggle-folding":
                    this.toggleFolding(line);
                    break;
            }
        };
        this.view.scrollDOM.addEventListener("scroll", this.onScroll);
        this.settings.onChange(this.scheduleRecalculate);
        this.prepareDom();
        this.waitForEditor();
    }
    prepareDom() {
        this.contentContainer = document.createElement("div");
        this.contentContainer.classList.add("outliner-plugin-list-lines-content-container");
        this.scroller = document.createElement("div");
        this.scroller.classList.add("outliner-plugin-list-lines-scroller");
        this.scroller.appendChild(this.contentContainer);
        this.view.dom.appendChild(this.scroller);
    }
    update(update) {
        if (update.docChanged ||
            update.viewportChanged ||
            update.geometryChanged ||
            update.transactions.some((tr) => tr.reconfigured)) {
            this.scheduleRecalculate();
        }
    }
    getNextSibling(list) {
        let listTmp = list;
        let p = listTmp.getParent();
        while (p) {
            const nextSibling = p.getNextSiblingOf(listTmp);
            if (nextSibling) {
                return nextSibling;
            }
            listTmp = p;
            p = listTmp.getParent();
        }
        return null;
    }
    recursive(list, parentCtx = {}) {
        const children = list.getChildren();
        if (children.length === 0) {
            return;
        }
        const fromOffset = this.editor.posToOffset({
            line: list.getFirstLineContentStart().line,
            ch: list.getFirstLineIndent().length,
        });
        const nextSibling = this.getNextSibling(list);
        const tillOffset = this.editor.posToOffset({
            line: nextSibling
                ? nextSibling.getFirstLineContentStart().line - 1
                : this.lastLine,
            ch: 0,
        });
        let visibleFrom = this.view.visibleRanges[0].from;
        let visibleTo = this.view.visibleRanges[this.view.visibleRanges.length - 1].to;
        const zoomRange = this.editor.getZoomRange();
        if (zoomRange) {
            visibleFrom = Math.max(visibleFrom, this.editor.posToOffset(zoomRange.from));
            visibleTo = Math.min(visibleTo, this.editor.posToOffset(zoomRange.to));
        }
        if (fromOffset > visibleTo || tillOffset < visibleFrom) {
            return;
        }
        const coords = this.view.coordsAtPos(fromOffset, 1);
        if (parentCtx.rootLeft === undefined) {
            parentCtx.rootLeft = coords.left;
        }
        const left = Math.floor(coords.right - parentCtx.rootLeft);
        const top = visibleFrom > 0 && fromOffset < visibleFrom
            ? -20
            : this.view.lineBlockAt(fromOffset).top;
        const bottom = tillOffset > visibleTo
            ? this.view.lineBlockAt(visibleTo - 1).bottom
            : this.view.lineBlockAt(tillOffset).bottom;
        const height = bottom - top;
        if (height > 0 && !list.isFolded()) {
            const nextSibling = list.getParent().getNextSiblingOf(list);
            const hasNextSibling = !!nextSibling &&
                this.editor.posToOffset(nextSibling.getFirstLineContentStart()) <=
                    visibleTo;
            this.lines.push({
                top,
                left,
                height: `calc(${height}px ${hasNextSibling ? "- 1.5em" : "- 2em"})`,
                list,
            });
        }
        for (const child of children) {
            if (!child.isEmpty()) {
                this.recursive(child, parentCtx);
            }
        }
    }
    zoomIn(line) {
        const editor = getEditorFromState(this.view.state);
        editor.zoomIn(line.list.getFirstLineContentStart().line);
    }
    toggleFolding(line) {
        const { list } = line;
        if (list.isEmpty()) {
            return;
        }
        let needToUnfold = true;
        const linesToToggle = [];
        for (const c of list.getChildren()) {
            if (c.isEmpty()) {
                continue;
            }
            if (!c.isFolded()) {
                needToUnfold = false;
            }
            linesToToggle.push(c.getFirstLineContentStart().line);
        }
        const editor = getEditorFromState(this.view.state);
        for (const l of linesToToggle) {
            if (needToUnfold) {
                editor.unfold(l);
            }
            else {
                editor.fold(l);
            }
        }
    }
    updateDom() {
        const cmScroll = this.view.scrollDOM;
        const cmContent = this.view.contentDOM;
        const cmContentContainer = cmContent.parentElement;
        const cmSizer = cmContentContainer.parentElement;
        /**
         * Obsidian can add additional elements into Content Manager.
         * The most obvious case is the 'embedded-backlinks' core plugin that adds a menu inside a Content Manager.
         * We must take heights of all of these elements into account
         * to be able to calculate the correct size of lines' container.
         */
        let cmSizerChildrenSumHeight = 0;
        for (let i = 0; i < cmSizer.children.length; i++) {
            cmSizerChildrenSumHeight += cmSizer.children[i].clientHeight;
        }
        this.scroller.style.top = cmScroll.offsetTop + "px";
        this.contentContainer.style.height = cmSizerChildrenSumHeight + "px";
        this.contentContainer.style.marginLeft =
            cmContentContainer.offsetLeft + "px";
        this.contentContainer.style.marginTop =
            cmContent.firstElementChild.offsetTop - 24 + "px";
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lineElements.length === i) {
                const e = document.createElement("div");
                e.classList.add("outliner-plugin-list-line");
                e.dataset.index = String(i);
                e.addEventListener("mousedown", this.onClick);
                this.contentContainer.appendChild(e);
                this.lineElements.push(e);
            }
            const l = this.lines[i];
            const e = this.lineElements[i];
            e.style.top = l.top + "px";
            e.style.left = l.left + "px";
            e.style.height = l.height;
            e.style.display = "block";
        }
        for (let i = this.lines.length; i < this.lineElements.length; i++) {
            const e = this.lineElements[i];
            e.style.top = "0px";
            e.style.left = "0px";
            e.style.height = "0px";
            e.style.display = "none";
        }
    }
    destroy() {
        this.settings.removeCallback(this.scheduleRecalculate);
        this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
        this.view.dom.removeChild(this.scroller);
        clearTimeout(this.scheduled);
    }
}
class VerticalLines {
    constructor(plugin, settings, obsidianSettings, parser) {
        this.plugin = plugin;
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.updateBodyClass = () => {
            const shouldExists = this.obsidianSettings.isDefaultThemeEnabled() &&
                this.settings.verticalLines;
            const exists = document.body.classList.contains(VERTICAL_LINES_BODY_CLASS);
            if (shouldExists && !exists) {
                document.body.classList.add(VERTICAL_LINES_BODY_CLASS);
            }
            if (!shouldExists && exists) {
                document.body.classList.remove(VERTICAL_LINES_BODY_CLASS);
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateBodyClass();
            this.updateBodyClassInterval = window.setInterval(() => {
                this.updateBodyClass();
            }, 1000);
            this.plugin.registerEditorExtension(view.ViewPlugin.define((view) => new VerticalLinesPluginValue(this.settings, this.obsidianSettings, this.parser, view)));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.updateBodyClassInterval);
            document.body.classList.remove(VERTICAL_LINES_BODY_CLASS);
        });
    }
}

class ChangesApplicator {
    apply(editor, prevRoot, newRoot) {
        const changes = this.calculateChanges(editor, prevRoot, newRoot);
        if (changes) {
            const { replacement, changeFrom, changeTo } = changes;
            const { unfold, fold } = this.calculateFoldingOprations(prevRoot, newRoot, changeFrom, changeTo);
            for (const line of unfold) {
                editor.unfold(line);
            }
            editor.replaceRange(replacement, changeFrom, changeTo);
            for (const line of fold) {
                editor.fold(line);
            }
        }
        editor.setSelections(newRoot.getSelections());
    }
    calculateChanges(editor, prevRoot, newRoot) {
        const rootRange = prevRoot.getContentRange();
        const oldString = editor.getRange(rootRange[0], rootRange[1]);
        const newString = newRoot.print();
        const changeFrom = Object.assign({}, rootRange[0]);
        const changeTo = Object.assign({}, rootRange[1]);
        let oldTmp = oldString;
        let newTmp = newString;
        while (true) {
            const nlIndex = oldTmp.lastIndexOf("\n");
            if (nlIndex < 0) {
                break;
            }
            const oldLine = oldTmp.slice(nlIndex);
            const newLine = newTmp.slice(-oldLine.length);
            if (oldLine !== newLine) {
                break;
            }
            oldTmp = oldTmp.slice(0, -oldLine.length);
            newTmp = newTmp.slice(0, -oldLine.length);
            const nlIndex2 = oldTmp.lastIndexOf("\n");
            changeTo.ch =
                nlIndex2 >= 0 ? oldTmp.length - nlIndex2 - 1 : oldTmp.length;
            changeTo.line--;
        }
        while (true) {
            const nlIndex = oldTmp.indexOf("\n");
            if (nlIndex < 0) {
                break;
            }
            const oldLine = oldTmp.slice(0, nlIndex + 1);
            const newLine = newTmp.slice(0, oldLine.length);
            if (oldLine !== newLine) {
                break;
            }
            changeFrom.line++;
            oldTmp = oldTmp.slice(oldLine.length);
            newTmp = newTmp.slice(oldLine.length);
        }
        if (oldTmp === newTmp) {
            return null;
        }
        return {
            replacement: newTmp,
            changeFrom,
            changeTo,
        };
    }
    calculateFoldingOprations(prevRoot, newRoot, changeFrom, changeTo) {
        const changedRange = [changeFrom, changeTo];
        const prevLists = getAllChildren(prevRoot);
        const newLists = getAllChildren(newRoot);
        const unfold = [];
        const fold = [];
        for (const prevList of prevLists.values()) {
            if (!prevList.isFoldRoot()) {
                continue;
            }
            const newList = newLists.get(prevList.getID());
            if (!newList) {
                continue;
            }
            const prevListRange = [
                prevList.getFirstLineContentStart(),
                prevList.getContentEndIncludingChildren(),
            ];
            if (isRangesIntersects(prevListRange, changedRange)) {
                unfold.push(prevList.getFirstLineContentStart().line);
                fold.push(newList.getFirstLineContentStart().line);
            }
        }
        unfold.sort((a, b) => b - a);
        fold.sort((a, b) => b - a);
        return { unfold, fold };
    }
}
function getAllChildrenReduceFn(acc, child) {
    acc.set(child.getID(), child);
    child.getChildren().reduce(getAllChildrenReduceFn, acc);
    return acc;
}
function getAllChildren(root) {
    return root.getChildren().reduce(getAllChildrenReduceFn, new Map());
}

class IMEDetector {
    constructor() {
        this.composition = false;
        this.onCompositionStart = () => {
            this.composition = true;
        };
        this.onCompositionEnd = () => {
            this.composition = false;
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            document.addEventListener("compositionstart", this.onCompositionStart);
            document.addEventListener("compositionend", this.onCompositionEnd);
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            document.removeEventListener("compositionend", this.onCompositionEnd);
            document.removeEventListener("compositionstart", this.onCompositionStart);
        });
    }
    isOpened() {
        return this.composition && obsidian.Platform.isDesktop;
    }
}

class Logger {
    constructor(settings) {
        this.settings = settings;
    }
    log(method, ...args) {
        if (!this.settings.debug) {
            return;
        }
        console.info(method, ...args);
    }
    bind(method) {
        return (...args) => this.log(method, ...args);
    }
}

function getHiddenObsidianConfig(app) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return app.vault.config;
}
class ObsidianSettings {
    constructor(app) {
        this.app = app;
    }
    isLegacyEditorEnabled() {
        const config = Object.assign({ legacyEditor: false }, getHiddenObsidianConfig(this.app));
        return config.legacyEditor;
    }
    isDefaultThemeEnabled() {
        const config = Object.assign({ cssTheme: "" }, getHiddenObsidianConfig(this.app));
        return config.cssTheme === "";
    }
    getTabsSettings() {
        return Object.assign({ useTab: true, tabSize: 4 }, getHiddenObsidianConfig(this.app));
    }
    getFoldSettings() {
        return Object.assign({ foldIndent: true }, getHiddenObsidianConfig(this.app));
    }
    getDefaultIndentChars() {
        const { useTab, tabSize } = this.getTabsSettings();
        return useTab ? "\t" : new Array(tabSize).fill(" ").join("");
    }
}

class OperationPerformer {
    constructor(parser, changesApplicator) {
        this.parser = parser;
        this.changesApplicator = changesApplicator;
    }
    eval(root, op, editor) {
        const prevRoot = root.clone();
        op.perform();
        if (op.shouldUpdate()) {
            this.changesApplicator.apply(editor, prevRoot, root);
        }
        return {
            shouldUpdate: op.shouldUpdate(),
            shouldStopPropagation: op.shouldStopPropagation(),
        };
    }
    perform(cb, editor, cursor = editor.getCursor()) {
        const root = this.parser.parse(editor, cursor);
        if (!root) {
            return { shouldUpdate: false, shouldStopPropagation: false };
        }
        const op = cb(root);
        return this.eval(root, op, editor);
    }
}

const bulletSignRe = `(?:[-*+]|\\d+\\.)`;
const optionalCheckboxRe = `(?:${checkboxRe})?`;
const listItemWithoutSpacesRe = new RegExp(`^${bulletSignRe}( |\t)`);
const listItemRe = new RegExp(`^[ \t]*${bulletSignRe}( |\t)`);
const stringWithSpacesRe = new RegExp(`^[ \t]+`);
const parseListItemRe = new RegExp(`^([ \t]*)(${bulletSignRe})( |\t)(${optionalCheckboxRe})(.*)$`);
class Parser {
    constructor(logger, settings) {
        this.logger = logger;
        this.settings = settings;
    }
    parseRange(editor, fromLine = 0, toLine = editor.lastLine()) {
        const lists = [];
        for (let i = fromLine; i <= toLine; i++) {
            const line = editor.getLine(i);
            if (i === fromLine || this.isListItem(line)) {
                const list = this.parseWithLimits(editor, i, fromLine, toLine);
                if (list) {
                    lists.push(list);
                    i = list.getContentEnd().line;
                }
            }
        }
        return lists;
    }
    parse(editor, cursor = editor.getCursor()) {
        return this.parseWithLimits(editor, cursor.line, 0, editor.lastLine());
    }
    parseWithLimits(editor, parsingStartLine, limitFrom, limitTo) {
        const d = this.logger.bind("parseList");
        const error = (msg) => {
            d(msg);
            return null;
        };
        const line = editor.getLine(parsingStartLine);
        let listLookingPos = null;
        if (this.isListItem(line)) {
            listLookingPos = parsingStartLine;
        }
        else if (this.isLineWithIndent(line)) {
            let listLookingPosSearch = parsingStartLine - 1;
            while (listLookingPosSearch >= 0) {
                const line = editor.getLine(listLookingPosSearch);
                if (this.isListItem(line)) {
                    listLookingPos = listLookingPosSearch;
                    break;
                }
                else if (this.isLineWithIndent(line)) {
                    listLookingPosSearch--;
                }
                else {
                    break;
                }
            }
        }
        if (listLookingPos === null) {
            return null;
        }
        let listStartLine = null;
        let listStartLineLookup = listLookingPos;
        while (listStartLineLookup >= 0) {
            const line = editor.getLine(listStartLineLookup);
            if (!this.isListItem(line) && !this.isLineWithIndent(line)) {
                break;
            }
            if (this.isListItemWithoutSpaces(line)) {
                listStartLine = listStartLineLookup;
                if (listStartLineLookup <= limitFrom) {
                    break;
                }
            }
            listStartLineLookup--;
        }
        if (listStartLine === null) {
            return null;
        }
        let listEndLine = listLookingPos;
        let listEndLineLookup = listLookingPos;
        while (listEndLineLookup <= editor.lastLine()) {
            const line = editor.getLine(listEndLineLookup);
            if (!this.isListItem(line) && !this.isLineWithIndent(line)) {
                break;
            }
            if (!this.isEmptyLine(line)) {
                listEndLine = listEndLineLookup;
            }
            if (listEndLineLookup >= limitTo) {
                listEndLine = limitTo;
                break;
            }
            listEndLineLookup++;
        }
        if (listStartLine > parsingStartLine || listEndLine < parsingStartLine) {
            return null;
        }
        // if the last line contains only spaces and that's incorrect indent, then ignore the last line
        // https://github.com/vslinko/obsidian-outliner/issues/368
        if (listEndLine > listStartLine) {
            const lastLine = editor.getLine(listEndLine);
            if (lastLine.trim().length === 0) {
                const prevLine = editor.getLine(listEndLine - 1);
                const [, prevLineIndent] = /^(\s*)/.exec(prevLine);
                if (!lastLine.startsWith(prevLineIndent)) {
                    listEndLine--;
                }
            }
        }
        const root = new Root({ line: listStartLine, ch: 0 }, { line: listEndLine, ch: editor.getLine(listEndLine).length }, editor.listSelections().map((r) => ({
            anchor: { line: r.anchor.line, ch: r.anchor.ch },
            head: { line: r.head.line, ch: r.head.ch },
        })));
        let currentParent = root.getRootList();
        let currentList = null;
        let currentIndent = "";
        const foldedLines = editor.getAllFoldedLines();
        for (let l = listStartLine; l <= listEndLine; l++) {
            const line = editor.getLine(l);
            const matches = parseListItemRe.exec(line);
            if (matches) {
                const [, indent, bullet, spaceAfterBullet] = matches;
                let [, , , , optionalCheckbox, content] = matches;
                content = optionalCheckbox + content;
                if (this.settings.keepCursorWithinContent !== "bullet-and-checkbox") {
                    optionalCheckbox = "";
                }
                const compareLength = Math.min(currentIndent.length, indent.length);
                const indentSlice = indent.slice(0, compareLength);
                const currentIndentSlice = currentIndent.slice(0, compareLength);
                if (indentSlice !== currentIndentSlice) {
                    const expected = currentIndentSlice
                        .replace(/ /g, "S")
                        .replace(/\t/g, "T");
                    const got = indentSlice.replace(/ /g, "S").replace(/\t/g, "T");
                    return error(`Unable to parse list: expected indent "${expected}", got "${got}"`);
                }
                if (indent.length > currentIndent.length) {
                    currentParent = currentList;
                    currentIndent = indent;
                }
                else if (indent.length < currentIndent.length) {
                    while (currentParent.getFirstLineIndent().length >= indent.length &&
                        currentParent.getParent()) {
                        currentParent = currentParent.getParent();
                    }
                    currentIndent = indent;
                }
                const foldRoot = foldedLines.includes(l);
                currentList = new List(root, indent, bullet, optionalCheckbox, spaceAfterBullet, content, foldRoot);
                currentParent.addAfterAll(currentList);
            }
            else if (this.isLineWithIndent(line)) {
                if (!currentList) {
                    return error(`Unable to parse list: expected list item, got empty line`);
                }
                const indentToCheck = currentList.getNotesIndent() || currentIndent;
                if (line.indexOf(indentToCheck) !== 0) {
                    const expected = indentToCheck.replace(/ /g, "S").replace(/\t/g, "T");
                    const got = line
                        .match(/^[ \t]*/)[0]
                        .replace(/ /g, "S")
                        .replace(/\t/g, "T");
                    return error(`Unable to parse list: expected indent "${expected}", got "${got}"`);
                }
                if (!currentList.getNotesIndent()) {
                    const matches = line.match(/^[ \t]+/);
                    if (!matches || matches[0].length <= currentIndent.length) {
                        if (/^\s+$/.test(line)) {
                            continue;
                        }
                        return error(`Unable to parse list: expected some indent, got no indent`);
                    }
                    currentList.setNotesIndent(matches[0]);
                }
                currentList.addLine(line.slice(currentList.getNotesIndent().length));
            }
            else {
                return error(`Unable to parse list: expected list item or note, got "${line}"`);
            }
        }
        return root;
    }
    isEmptyLine(line) {
        return line.length === 0;
    }
    isLineWithIndent(line) {
        return stringWithSpacesRe.test(line);
    }
    isListItem(line) {
        return listItemRe.test(line);
    }
    isListItemWithoutSpaces(line) {
        return listItemWithoutSpacesRe.test(line);
    }
}

const DEFAULT_SETTINGS = {
    styleLists: true,
    debug: false,
    stickCursor: "bullet-and-checkbox",
    betterEnter: true,
    betterTab: true,
    selectAll: true,
    listLines: false,
    listLineAction: "toggle-folding",
    dndExperiment: false,
    previousRelease: null,
};
class Settings {
    constructor(storage) {
        this.storage = storage;
        this.callbacks = new Set();
    }
    get keepCursorWithinContent() {
        // Adaptor for users migrating from older version of the plugin.
        if (this.values.stickCursor === true) {
            return "bullet-and-checkbox";
        }
        else if (this.values.stickCursor === false) {
            return "never";
        }
        return this.values.stickCursor;
    }
    set keepCursorWithinContent(value) {
        this.set("stickCursor", value);
    }
    get overrideTabBehaviour() {
        return this.values.betterTab;
    }
    set overrideTabBehaviour(value) {
        this.set("betterTab", value);
    }
    get overrideEnterBehaviour() {
        return this.values.betterEnter;
    }
    set overrideEnterBehaviour(value) {
        this.set("betterEnter", value);
    }
    get overrideSelectAllBehaviour() {
        return this.values.selectAll;
    }
    set overrideSelectAllBehaviour(value) {
        this.set("selectAll", value);
    }
    get betterListsStyles() {
        return this.values.styleLists;
    }
    set betterListsStyles(value) {
        this.set("styleLists", value);
    }
    get verticalLines() {
        return this.values.listLines;
    }
    set verticalLines(value) {
        this.set("listLines", value);
    }
    get verticalLinesAction() {
        return this.values.listLineAction;
    }
    set verticalLinesAction(value) {
        this.set("listLineAction", value);
    }
    get dragAndDrop() {
        return this.values.dndExperiment;
    }
    set dragAndDrop(value) {
        this.set("dndExperiment", value);
    }
    get debug() {
        return this.values.debug;
    }
    set debug(value) {
        this.set("debug", value);
    }
    get previousRelease() {
        return this.values.previousRelease;
    }
    set previousRelease(value) {
        this.set("previousRelease", value);
    }
    onChange(cb) {
        this.callbacks.add(cb);
    }
    removeCallback(cb) {
        this.callbacks.delete(cb);
    }
    reset() {
        for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
            this.set(k, v);
        }
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.values = Object.assign({}, DEFAULT_SETTINGS, yield this.storage.loadData());
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.storage.saveData(this.values);
        });
    }
    set(key, value) {
        this.values[key] = value;
        for (const cb of this.callbacks) {
            cb();
        }
    }
}

class ObsidianOutlinerPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Loading obsidian-outliner`);
            yield this.prepareSettings();
            this.obsidianSettings = new ObsidianSettings(this.app);
            this.logger = new Logger(this.settings);
            this.parser = new Parser(this.logger, this.settings);
            this.changesApplicator = new ChangesApplicator();
            this.operationPerformer = new OperationPerformer(this.parser, this.changesApplicator);
            this.imeDetector = new IMEDetector();
            yield this.imeDetector.load();
            this.features = [
                // service features
                new ReleaseNotesAnnouncement(this, this.settings),
                new SettingsTab(this, this.settings),
                // general features
                new ListsMovementCommands(this, this.obsidianSettings, this.operationPerformer),
                new ListsFoldingCommands(this, this.obsidianSettings),
                // features based on settings.keepCursorWithinContent
                new EditorSelectionsBehaviourOverride(this, this.settings, this.parser, this.operationPerformer),
                new ArrowLeftAndCtrlArrowLeftBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                new BackspaceBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                new MetaBackspaceBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                new DeleteBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                // features based on settings.overrideTabBehaviour
                new TabBehaviourOverride(this, this.imeDetector, this.obsidianSettings, this.settings, this.operationPerformer),
                new ShiftTabBehaviourOverride(this, this.imeDetector, this.settings, this.operationPerformer),
                // features based on settings.overrideEnterBehaviour
                new EnterBehaviourOverride(this, this.settings, this.imeDetector, this.obsidianSettings, this.parser, this.operationPerformer),
                // features based on settings.overrideSelectAllBehaviour
                new CtrlAAndCmdABehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                // features based on settings.betterListsStyles
                new BetterListsStyles(this.settings, this.obsidianSettings),
                // features based on settings.verticalLines
                new VerticalLines(this, this.settings, this.obsidianSettings, this.parser),
                // features based on settings.dragAndDrop
                new DragAndDrop(this, this.settings, this.obsidianSettings, this.parser, this.operationPerformer),
            ];
            for (const feature of this.features) {
                yield feature.load();
            }
        });
    }
    onunload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Unloading obsidian-outliner`);
            yield this.imeDetector.unload();
            for (const feature of this.features) {
                yield feature.unload();
            }
        });
    }
    prepareSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = new Settings(this);
            yield this.settings.load();
        });
    }
}

module.exports = ObsidianOutlinerPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9vcGVyYXRpb25zL01vdmVDdXJzb3JUb1ByZXZpb3VzVW5mb2xkZWRMaW5lLnRzIiwic3JjL2VkaXRvci9pbmRleC50cyIsInNyYy91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFjay50cyIsInNyYy9mZWF0dXJlcy9BcnJvd0xlZnRBbmRDdHJsQXJyb3dMZWZ0QmVoYXZpb3VyT3ZlcnJpZGUudHMiLCJzcmMvcm9vdC9pbmRleC50cyIsInNyYy9vcGVyYXRpb25zL0RlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kLnRzIiwic3JjL2ZlYXR1cmVzL0JhY2tzcGFjZUJlaGF2aW91ck92ZXJyaWRlLnRzIiwic3JjL2ZlYXR1cmVzL0JldHRlckxpc3RzU3R5bGVzLnRzIiwic3JjL29wZXJhdGlvbnMvU2VsZWN0QWxsQ29udGVudC50cyIsInNyYy9mZWF0dXJlcy9DdHJsQUFuZENtZEFCZWhhdmlvdXJPdmVycmlkZS50cyIsInNyYy9vcGVyYXRpb25zL0RlbGV0ZVRpbGxOZXh0TGluZUNvbnRlbnRTdGFydC50cyIsInNyYy9mZWF0dXJlcy9EZWxldGVCZWhhdmlvdXJPdmVycmlkZS50cyIsInNyYy9vcGVyYXRpb25zL01vdmVMaXN0VG9EaWZmZXJlbnRQb3NpdGlvbi50cyIsInNyYy9mZWF0dXJlcy9EcmFnQW5kRHJvcC50cyIsInNyYy9vcGVyYXRpb25zL0tlZXBDdXJzb3JPdXRzaWRlRm9sZGVkTGluZXMudHMiLCJzcmMvb3BlcmF0aW9ucy9LZWVwQ3Vyc29yV2l0aGluTGlzdENvbnRlbnQudHMiLCJzcmMvZmVhdHVyZXMvRWRpdG9yU2VsZWN0aW9uc0JlaGF2aW91ck92ZXJyaWRlLnRzIiwic3JjL3V0aWxzL2NoZWNrYm94UmUudHMiLCJzcmMvdXRpbHMvaXNFbXB0eUxpbmVPckVtcHR5Q2hlY2tib3gudHMiLCJzcmMvb3BlcmF0aW9ucy9DcmVhdGVOZXdJdGVtLnRzIiwic3JjL29wZXJhdGlvbnMvT3V0ZGVudExpc3QudHMiLCJzcmMvb3BlcmF0aW9ucy9PdXRkZW50TGlzdElmSXRzRW1wdHkudHMiLCJzcmMvZmVhdHVyZXMvRW50ZXJCZWhhdmlvdXJPdmVycmlkZS50cyIsInNyYy91dGlscy9jcmVhdGVFZGl0b3JDYWxsYmFjay50cyIsInNyYy9mZWF0dXJlcy9MaXN0c0ZvbGRpbmdDb21tYW5kcy50cyIsInNyYy9vcGVyYXRpb25zL0luZGVudExpc3QudHMiLCJzcmMvb3BlcmF0aW9ucy9Nb3ZlTGlzdERvd24udHMiLCJzcmMvb3BlcmF0aW9ucy9Nb3ZlTGlzdFVwLnRzIiwic3JjL2ZlYXR1cmVzL0xpc3RzTW92ZW1lbnRDb21tYW5kcy50cyIsInNyYy9vcGVyYXRpb25zL0RlbGV0ZVRpbGxDdXJyZW50TGluZUNvbnRlbnRTdGFydC50cyIsInNyYy9mZWF0dXJlcy9NZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUudHMiLCJzcmMvZmVhdHVyZXMvUmVsZWFzZU5vdGVzQW5ub3VuY2VtZW50LnRzIiwic3JjL2ZlYXR1cmVzL1NldHRpbmdzVGFiLnRzIiwic3JjL2ZlYXR1cmVzL1NoaWZ0VGFiQmVoYXZpb3VyT3ZlcnJpZGUudHMiLCJzcmMvZmVhdHVyZXMvVGFiQmVoYXZpb3VyT3ZlcnJpZGUudHMiLCJzcmMvZmVhdHVyZXMvVmVydGljYWxMaW5lcy50cyIsInNyYy9zZXJ2aWNlcy9DaGFuZ2VzQXBwbGljYXRvci50cyIsInNyYy9zZXJ2aWNlcy9JTUVEZXRlY3Rvci50cyIsInNyYy9zZXJ2aWNlcy9Mb2dnZXIudHMiLCJzcmMvc2VydmljZXMvT2JzaWRpYW5TZXR0aW5ncy50cyIsInNyYy9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXIudHMiLCJzcmMvc2VydmljZXMvUGFyc2VyLnRzIiwic3JjL3NlcnZpY2VzL1NldHRpbmdzLnRzIiwic3JjL09ic2lkaWFuT3V0bGluZXJQbHVnaW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2VzRGVjb3JhdGUoY3RvciwgZGVzY3JpcHRvckluLCBkZWNvcmF0b3JzLCBjb250ZXh0SW4sIGluaXRpYWxpemVycywgZXh0cmFJbml0aWFsaXplcnMpIHtcclxuICAgIGZ1bmN0aW9uIGFjY2VwdChmKSB7IGlmIChmICE9PSB2b2lkIDAgJiYgdHlwZW9mIGYgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZ1bmN0aW9uIGV4cGVjdGVkXCIpOyByZXR1cm4gZjsgfVxyXG4gICAgdmFyIGtpbmQgPSBjb250ZXh0SW4ua2luZCwga2V5ID0ga2luZCA9PT0gXCJnZXR0ZXJcIiA/IFwiZ2V0XCIgOiBraW5kID09PSBcInNldHRlclwiID8gXCJzZXRcIiA6IFwidmFsdWVcIjtcclxuICAgIHZhciB0YXJnZXQgPSAhZGVzY3JpcHRvckluICYmIGN0b3IgPyBjb250ZXh0SW5bXCJzdGF0aWNcIl0gPyBjdG9yIDogY3Rvci5wcm90b3R5cGUgOiBudWxsO1xyXG4gICAgdmFyIGRlc2NyaXB0b3IgPSBkZXNjcmlwdG9ySW4gfHwgKHRhcmdldCA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBjb250ZXh0SW4ubmFtZSkgOiB7fSk7XHJcbiAgICB2YXIgXywgZG9uZSA9IGZhbHNlO1xyXG4gICAgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICB2YXIgY29udGV4dCA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIHAgaW4gY29udGV4dEluKSBjb250ZXh0W3BdID0gcCA9PT0gXCJhY2Nlc3NcIiA/IHt9IDogY29udGV4dEluW3BdO1xyXG4gICAgICAgIGZvciAodmFyIHAgaW4gY29udGV4dEluLmFjY2VzcykgY29udGV4dC5hY2Nlc3NbcF0gPSBjb250ZXh0SW4uYWNjZXNzW3BdO1xyXG4gICAgICAgIGNvbnRleHQuYWRkSW5pdGlhbGl6ZXIgPSBmdW5jdGlvbiAoZikgeyBpZiAoZG9uZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBhZGQgaW5pdGlhbGl6ZXJzIGFmdGVyIGRlY29yYXRpb24gaGFzIGNvbXBsZXRlZFwiKTsgZXh0cmFJbml0aWFsaXplcnMucHVzaChhY2NlcHQoZiB8fCBudWxsKSk7IH07XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9ICgwLCBkZWNvcmF0b3JzW2ldKShraW5kID09PSBcImFjY2Vzc29yXCIgPyB7IGdldDogZGVzY3JpcHRvci5nZXQsIHNldDogZGVzY3JpcHRvci5zZXQgfSA6IGRlc2NyaXB0b3Jba2V5XSwgY29udGV4dCk7XHJcbiAgICAgICAgaWYgKGtpbmQgPT09IFwiYWNjZXNzb3JcIikge1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB2b2lkIDApIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsIHx8IHR5cGVvZiByZXN1bHQgIT09IFwib2JqZWN0XCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3QgZXhwZWN0ZWRcIik7XHJcbiAgICAgICAgICAgIGlmIChfID0gYWNjZXB0KHJlc3VsdC5nZXQpKSBkZXNjcmlwdG9yLmdldCA9IF87XHJcbiAgICAgICAgICAgIGlmIChfID0gYWNjZXB0KHJlc3VsdC5zZXQpKSBkZXNjcmlwdG9yLnNldCA9IF87XHJcbiAgICAgICAgICAgIGlmIChfID0gYWNjZXB0KHJlc3VsdC5pbml0KSkgaW5pdGlhbGl6ZXJzLnB1c2goXyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKF8gPSBhY2NlcHQocmVzdWx0KSkge1xyXG4gICAgICAgICAgICBpZiAoa2luZCA9PT0gXCJmaWVsZFwiKSBpbml0aWFsaXplcnMucHVzaChfKTtcclxuICAgICAgICAgICAgZWxzZSBkZXNjcmlwdG9yW2tleV0gPSBfO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0YXJnZXQpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGNvbnRleHRJbi5uYW1lLCBkZXNjcmlwdG9yKTtcclxuICAgIGRvbmUgPSB0cnVlO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcnVuSW5pdGlhbGl6ZXJzKHRoaXNBcmcsIGluaXRpYWxpemVycywgdmFsdWUpIHtcclxuICAgIHZhciB1c2VWYWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbml0aWFsaXplcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YWx1ZSA9IHVzZVZhbHVlID8gaW5pdGlhbGl6ZXJzW2ldLmNhbGwodGhpc0FyZywgdmFsdWUpIDogaW5pdGlhbGl6ZXJzW2ldLmNhbGwodGhpc0FyZyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXNlVmFsdWUgPyB2YWx1ZSA6IHZvaWQgMDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Byb3BLZXkoeCkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcInN5bWJvbFwiID8geCA6IFwiXCIuY29uY2F0KHgpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc2V0RnVuY3Rpb25OYW1lKGYsIG5hbWUsIHByZWZpeCkge1xyXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN5bWJvbFwiKSBuYW1lID0gbmFtZS5kZXNjcmlwdGlvbiA/IFwiW1wiLmNvbmNhdChuYW1lLmRlc2NyaXB0aW9uLCBcIl1cIikgOiBcIlwiO1xyXG4gICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmLCBcIm5hbWVcIiwgeyBjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiBwcmVmaXggPyBcIlwiLmNvbmNhdChwcmVmaXgsIFwiIFwiLCBuYW1lKSA6IG5hbWUgfSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKGcgJiYgKGcgPSAwLCBvcFswXSAmJiAoXyA9IDApKSwgXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobSwgayk7XHJcbiAgICBpZiAoIWRlc2MgfHwgKFwiZ2V0XCIgaW4gZGVzYyA/ICFtLl9fZXNNb2R1bGUgOiBkZXNjLndyaXRhYmxlIHx8IGRlc2MuY29uZmlndXJhYmxlKSkge1xyXG4gICAgICAgIGRlc2MgPSB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH07XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSwgcGFjaykge1xyXG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XHJcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XHJcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBmYWxzZSB9IDogZiA/IGYodikgOiB2OyB9IDogZjsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY1ZhbHVlcyhvKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIG0gPSBvW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSwgaTtcclxuICAgIHJldHVybiBtID8gbS5jYWxsKG8pIDogKG8gPSB0eXBlb2YgX192YWx1ZXMgPT09IFwiZnVuY3Rpb25cIiA/IF9fdmFsdWVzKG8pIDogb1tTeW1ib2wuaXRlcmF0b3JdKCksIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpKTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpW25dID0gb1tuXSAmJiBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2ID0gb1tuXSh2KSwgc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgdi5kb25lLCB2LnZhbHVlKTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShyZXNvbHZlLCByZWplY3QsIGQsIHYpIHsgUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZnVuY3Rpb24odikgeyByZXNvbHZlKHsgdmFsdWU6IHYsIGRvbmU6IGQgfSk7IH0sIHJlamVjdCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWFrZVRlbXBsYXRlT2JqZWN0KGNvb2tlZCwgcmF3KSB7XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb29rZWQsIFwicmF3XCIsIHsgdmFsdWU6IHJhdyB9KTsgfSBlbHNlIHsgY29va2VkLnJhdyA9IHJhdzsgfVxyXG4gICAgcmV0dXJuIGNvb2tlZDtcclxufTtcclxuXHJcbnZhciBfX3NldE1vZHVsZURlZmF1bHQgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBcImRlZmF1bHRcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdiB9KTtcclxufSkgOiBmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBvW1wiZGVmYXVsdFwiXSA9IHY7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xyXG4gICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayBpbiBtb2QpIGlmIChrICE9PSBcImRlZmF1bHRcIiAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgX19jcmVhdGVCaW5kaW5nKHJlc3VsdCwgbW9kLCBrKTtcclxuICAgIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRHZXQocmVjZWl2ZXIsIHN0YXRlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBnZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZWFkIHByaXZhdGUgbWVtYmVyIGZyb20gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiBraW5kID09PSBcIm1cIiA/IGYgOiBraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlcikgOiBmID8gZi52YWx1ZSA6IHN0YXRlLmdldChyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHJlY2VpdmVyLCBzdGF0ZSwgdmFsdWUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcIm1cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgbWV0aG9kIGlzIG5vdCB3cml0YWJsZVwiKTtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIHNldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHdyaXRlIHByaXZhdGUgbWVtYmVyIHRvIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4gKGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyLCB2YWx1ZSkgOiBmID8gZi52YWx1ZSA9IHZhbHVlIDogc3RhdGUuc2V0KHJlY2VpdmVyLCB2YWx1ZSkpLCB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRJbihzdGF0ZSwgcmVjZWl2ZXIpIHtcclxuICAgIGlmIChyZWNlaXZlciA9PT0gbnVsbCB8fCAodHlwZW9mIHJlY2VpdmVyICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiByZWNlaXZlciAhPT0gXCJmdW5jdGlvblwiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB1c2UgJ2luJyBvcGVyYXRvciBvbiBub24tb2JqZWN0XCIpO1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgPT09IHN0YXRlIDogc3RhdGUuaGFzKHJlY2VpdmVyKTtcclxufVxyXG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgTGlzdExpbmUsIFBvc2l0aW9uLCBSb290IH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIE1vdmVDdXJzb3JUb1ByZXZpb3VzVW5mb2xkZWRMaW5lIGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBSb290KSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZUN1cnNvcigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHRoaXMucm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLnJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgbGluZXMgPSBsaXN0LmdldExpbmVzSW5mbygpO1xuICAgIGNvbnN0IGxpbmVObyA9IGxpbmVzLmZpbmRJbmRleCgobCkgPT4ge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgY3Vyc29yLmNoID09PSBsLmZyb20uY2ggKyBsaXN0LmdldENoZWNrYm94TGVuZ3RoKCkgJiZcbiAgICAgICAgY3Vyc29yLmxpbmUgPT09IGwuZnJvbS5saW5lXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaWYgKGxpbmVObyA9PT0gMCkge1xuICAgICAgdGhpcy5tb3ZlQ3Vyc29yVG9QcmV2aW91c1VuZm9sZGVkSXRlbShyb290LCBjdXJzb3IpO1xuICAgIH0gZWxzZSBpZiAobGluZU5vID4gMCkge1xuICAgICAgdGhpcy5tb3ZlQ3Vyc29yVG9QcmV2aW91c05vdGVMaW5lKHJvb3QsIGxpbmVzLCBsaW5lTm8pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbW92ZUN1cnNvclRvUHJldmlvdXNOb3RlTGluZShcbiAgICByb290OiBSb290LFxuICAgIGxpbmVzOiBMaXN0TGluZVtdLFxuICAgIGxpbmVObzogbnVtYmVyXG4gICkge1xuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKGxpbmVzW2xpbmVObyAtIDFdLnRvKTtcbiAgfVxuXG4gIHByaXZhdGUgbW92ZUN1cnNvclRvUHJldmlvdXNVbmZvbGRlZEl0ZW0ocm9vdDogUm9vdCwgY3Vyc29yOiBQb3NpdGlvbikge1xuICAgIGNvbnN0IHByZXYgPSByb290LmdldExpc3RVbmRlckxpbmUoY3Vyc29yLmxpbmUgLSAxKTtcblxuICAgIGlmICghcHJldikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKHByZXYuaXNGb2xkZWQoKSkge1xuICAgICAgY29uc3QgZm9sZFJvb3QgPSBwcmV2LmdldFRvcEZvbGRSb290KCk7XG4gICAgICBjb25zdCBmaXJzdExpbmVFbmQgPSBmb2xkUm9vdC5nZXRMaW5lc0luZm8oKVswXS50bztcbiAgICAgIHJvb3QucmVwbGFjZUN1cnNvcihmaXJzdExpbmVFbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByb290LnJlcGxhY2VDdXJzb3IocHJldi5nZXRMYXN0TGluZUNvbnRlbnRFbmQoKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3IsIGVkaXRvckluZm9GaWVsZCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQge1xuICBmb2xkRWZmZWN0LFxuICBmb2xkYWJsZSxcbiAgZm9sZGVkUmFuZ2VzLFxuICB1bmZvbGRFZmZlY3QsXG59IGZyb20gXCJAY29kZW1pcnJvci9sYW5ndWFnZVwiO1xuaW1wb3J0IHsgRWRpdG9yU3RhdGUgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIjtcbmltcG9ydCB7IEVkaXRvclZpZXcsIHJ1blNjb3BlSGFuZGxlcnMgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgTXlFZGl0b3JQb3NpdGlvbiB7XG4gIGxpbmU6IG51bWJlcjtcbiAgY2g6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIE15RWRpdG9yUmFuZ2Uge1xuICBmcm9tOiBNeUVkaXRvclBvc2l0aW9uO1xuICB0bzogTXlFZGl0b3JQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGNsYXNzIE15RWRpdG9yU2VsZWN0aW9uIHtcbiAgYW5jaG9yOiBNeUVkaXRvclBvc2l0aW9uO1xuICBoZWFkOiBNeUVkaXRvclBvc2l0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWRpdG9yRnJvbVN0YXRlKHN0YXRlOiBFZGl0b3JTdGF0ZSkge1xuICBjb25zdCB7IGVkaXRvciB9ID0gc3RhdGUuZmllbGQoZWRpdG9ySW5mb0ZpZWxkKTtcblxuICBpZiAoIWVkaXRvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBNeUVkaXRvcihlZGl0b3IpO1xufVxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIE9ic2lkaWFuWm9vbVBsdWdpbj86IHtcbiAgICAgIGdldFpvb21SYW5nZShlOiBFZGl0b3IpOiBNeUVkaXRvclJhbmdlO1xuICAgICAgem9vbU91dChlOiBFZGl0b3IpOiB2b2lkO1xuICAgICAgem9vbUluKGU6IEVkaXRvciwgbGluZTogbnVtYmVyKTogdm9pZDtcbiAgICAgIHJlZnJlc2hab29tPyhlOiBFZGl0b3IpOiB2b2lkO1xuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9sZEluc2lkZSh2aWV3OiBFZGl0b3JWaWV3LCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpIHtcbiAgbGV0IGZvdW5kOiB7IGZyb206IG51bWJlcjsgdG86IG51bWJlciB9IHwgbnVsbCA9IG51bGw7XG4gIGZvbGRlZFJhbmdlcyh2aWV3LnN0YXRlKS5iZXR3ZWVuKGZyb20sIHRvLCAoZnJvbSwgdG8pID0+IHtcbiAgICBpZiAoIWZvdW5kIHx8IGZvdW5kLmZyb20gPiBmcm9tKSBmb3VuZCA9IHsgZnJvbSwgdG8gfTtcbiAgfSk7XG4gIHJldHVybiBmb3VuZDtcbn1cblxuZXhwb3J0IGNsYXNzIE15RWRpdG9yIHtcbiAgcHJpdmF0ZSB2aWV3OiBFZGl0b3JWaWV3O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZTogRWRpdG9yKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICB0aGlzLnZpZXcgPSAodGhpcy5lIGFzIGFueSkuY207XG4gIH1cblxuICBnZXRDdXJzb3IoKTogTXlFZGl0b3JQb3NpdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuZS5nZXRDdXJzb3IoKTtcbiAgfVxuXG4gIGdldExpbmUobjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5lLmdldExpbmUobik7XG4gIH1cblxuICBsYXN0TGluZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmUubGFzdExpbmUoKTtcbiAgfVxuXG4gIGxpc3RTZWxlY3Rpb25zKCk6IE15RWRpdG9yU2VsZWN0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLmUubGlzdFNlbGVjdGlvbnMoKTtcbiAgfVxuXG4gIGdldFJhbmdlKGZyb206IE15RWRpdG9yUG9zaXRpb24sIHRvOiBNeUVkaXRvclBvc2l0aW9uKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5lLmdldFJhbmdlKGZyb20sIHRvKTtcbiAgfVxuXG4gIHJlcGxhY2VSYW5nZShcbiAgICByZXBsYWNlbWVudDogc3RyaW5nLFxuICAgIGZyb206IE15RWRpdG9yUG9zaXRpb24sXG4gICAgdG86IE15RWRpdG9yUG9zaXRpb25cbiAgKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuZS5yZXBsYWNlUmFuZ2UocmVwbGFjZW1lbnQsIGZyb20sIHRvKTtcbiAgfVxuXG4gIHNldFNlbGVjdGlvbnMoc2VsZWN0aW9uczogTXlFZGl0b3JTZWxlY3Rpb25bXSk6IHZvaWQge1xuICAgIHRoaXMuZS5zZXRTZWxlY3Rpb25zKHNlbGVjdGlvbnMpO1xuICB9XG5cbiAgc2V0VmFsdWUodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5lLnNldFZhbHVlKHRleHQpO1xuICB9XG5cbiAgZ2V0VmFsdWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5lLmdldFZhbHVlKCk7XG4gIH1cblxuICBvZmZzZXRUb1BvcyhvZmZzZXQ6IG51bWJlcik6IE15RWRpdG9yUG9zaXRpb24ge1xuICAgIHJldHVybiB0aGlzLmUub2Zmc2V0VG9Qb3Mob2Zmc2V0KTtcbiAgfVxuXG4gIHBvc1RvT2Zmc2V0KHBvczogTXlFZGl0b3JQb3NpdGlvbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZS5wb3NUb09mZnNldChwb3MpO1xuICB9XG5cbiAgZm9sZChuOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCB7IHZpZXcgfSA9IHRoaXM7XG4gICAgY29uc3QgbCA9IHZpZXcubGluZUJsb2NrQXQodmlldy5zdGF0ZS5kb2MubGluZShuICsgMSkuZnJvbSk7XG4gICAgY29uc3QgcmFuZ2UgPSBmb2xkYWJsZSh2aWV3LnN0YXRlLCBsLmZyb20sIGwudG8pO1xuXG4gICAgaWYgKCFyYW5nZSB8fCByYW5nZS5mcm9tID09PSByYW5nZS50bykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZpZXcuZGlzcGF0Y2goeyBlZmZlY3RzOiBbZm9sZEVmZmVjdC5vZihyYW5nZSldIH0pO1xuICB9XG5cbiAgdW5mb2xkKG46IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHsgdmlldyB9ID0gdGhpcztcbiAgICBjb25zdCBsID0gdmlldy5saW5lQmxvY2tBdCh2aWV3LnN0YXRlLmRvYy5saW5lKG4gKyAxKS5mcm9tKTtcbiAgICBjb25zdCByYW5nZSA9IGZvbGRJbnNpZGUodmlldywgbC5mcm9tLCBsLnRvKTtcblxuICAgIGlmICghcmFuZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2aWV3LmRpc3BhdGNoKHsgZWZmZWN0czogW3VuZm9sZEVmZmVjdC5vZihyYW5nZSldIH0pO1xuICB9XG5cbiAgZ2V0QWxsRm9sZGVkTGluZXMoKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IGMgPSBmb2xkZWRSYW5nZXModGhpcy52aWV3LnN0YXRlKS5pdGVyKCk7XG4gICAgY29uc3QgcmVzOiBudW1iZXJbXSA9IFtdO1xuICAgIHdoaWxlIChjLnZhbHVlKSB7XG4gICAgICByZXMucHVzaCh0aGlzLm9mZnNldFRvUG9zKGMuZnJvbSkubGluZSk7XG4gICAgICBjLm5leHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIHRyaWdnZXJPbktleURvd24oZTogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIHJ1blNjb3BlSGFuZGxlcnModGhpcy52aWV3LCBlLCBcImVkaXRvclwiKTtcbiAgfVxuXG4gIGdldFpvb21SYW5nZSgpOiBNeUVkaXRvclJhbmdlIHwgbnVsbCB7XG4gICAgaWYgKCF3aW5kb3cuT2JzaWRpYW5ab29tUGx1Z2luKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbi5nZXRab29tUmFuZ2UodGhpcy5lKTtcbiAgfVxuXG4gIHpvb21PdXQoKSB7XG4gICAgaWYgKCF3aW5kb3cuT2JzaWRpYW5ab29tUGx1Z2luKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbi56b29tT3V0KHRoaXMuZSk7XG4gIH1cblxuICB6b29tSW4obGluZTogbnVtYmVyKSB7XG4gICAgaWYgKCF3aW5kb3cuT2JzaWRpYW5ab29tUGx1Z2luKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbi56b29tSW4odGhpcy5lLCBsaW5lKTtcbiAgfVxuXG4gIHRyeVJlZnJlc2hab29tKGxpbmU6IG51bWJlcikge1xuICAgIGlmICghd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh3aW5kb3cuT2JzaWRpYW5ab29tUGx1Z2luLnJlZnJlc2hab29tKSB7XG4gICAgICB3aW5kb3cuT2JzaWRpYW5ab29tUGx1Z2luLnJlZnJlc2hab29tKHRoaXMuZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5PYnNpZGlhblpvb21QbHVnaW4uem9vbUluKHRoaXMuZSwgbGluZSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3JWaWV3IH0gZnJvbSBcIkBjb2RlbWlycm9yL3ZpZXdcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IsIGdldEVkaXRvckZyb21TdGF0ZSB9IGZyb20gXCIuLi9lZGl0b3JcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKGNvbmZpZzoge1xuICBjaGVjaz86IChlZGl0b3I6IE15RWRpdG9yKSA9PiBib29sZWFuO1xuICBydW46IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgc2hvdWxkVXBkYXRlOiBib29sZWFuO1xuICAgIHNob3VsZFN0b3BQcm9wYWdhdGlvbjogYm9vbGVhbjtcbiAgfTtcbn0pIHtcbiAgY29uc3QgY2hlY2sgPSBjb25maWcuY2hlY2sgfHwgKCgpID0+IHRydWUpO1xuICBjb25zdCB7IHJ1biB9ID0gY29uZmlnO1xuXG4gIHJldHVybiAodmlldzogRWRpdG9yVmlldyk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGVkaXRvciA9IGdldEVkaXRvckZyb21TdGF0ZSh2aWV3LnN0YXRlKTtcblxuICAgIGlmICghY2hlY2soZWRpdG9yKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHsgc2hvdWxkVXBkYXRlLCBzaG91bGRTdG9wUHJvcGFnYXRpb24gfSA9IHJ1bihlZGl0b3IpO1xuXG4gICAgcmV0dXJuIHNob3VsZFVwZGF0ZSB8fCBzaG91bGRTdG9wUHJvcGFnYXRpb247XG4gIH07XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IE1vdmVDdXJzb3JUb1ByZXZpb3VzVW5mb2xkZWRMaW5lIH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvTW92ZUN1cnNvclRvUHJldmlvdXNVbmZvbGRlZExpbmVcIjtcbmltcG9ydCB7IElNRURldGVjdG9yIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIEFycm93TGVmdEFuZEN0cmxBcnJvd0xlZnRCZWhhdmlvdXJPdmVycmlkZSBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luXzIsXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBpbWVEZXRlY3RvcjogSU1FRGV0ZWN0b3IsXG4gICAgcHJpdmF0ZSBvcGVyYXRpb25QZXJmb3JtZXI6IE9wZXJhdGlvblBlcmZvcm1lclxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIGtleW1hcC5vZihbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwiQXJyb3dMZWZ0XCIsXG4gICAgICAgICAgcnVuOiBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayh7XG4gICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgIHJ1bjogdGhpcy5ydW4sXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB3aW46IFwiYy1BcnJvd0xlZnRcIixcbiAgICAgICAgICBsaW51eDogXCJjLUFycm93TGVmdFwiLFxuICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgY2hlY2s6IHRoaXMuY2hlY2ssXG4gICAgICAgICAgICBydW46IHRoaXMucnVuLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNoZWNrID0gKCkgPT4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLnNldHRpbmdzLmtlZXBDdXJzb3JXaXRoaW5Db250ZW50ICE9PSBcIm5ldmVyXCIgJiZcbiAgICAgICF0aGlzLmltZURldGVjdG9yLmlzT3BlbmVkKClcbiAgICApO1xuICB9O1xuXG4gIHByaXZhdGUgcnVuID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PiBuZXcgTW92ZUN1cnNvclRvUHJldmlvdXNVbmZvbGRlZExpbmUocm9vdCksXG4gICAgICBlZGl0b3JcbiAgICApO1xuICB9O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNtcFBvcyhhOiBQb3NpdGlvbiwgYjogUG9zaXRpb24pIHtcbiAgcmV0dXJuIGEubGluZSAtIGIubGluZSB8fCBhLmNoIC0gYi5jaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1heFBvcyhhOiBQb3NpdGlvbiwgYjogUG9zaXRpb24pIHtcbiAgcmV0dXJuIGNtcFBvcyhhLCBiKSA8IDAgPyBiIDogYTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pblBvcyhhOiBQb3NpdGlvbiwgYjogUG9zaXRpb24pIHtcbiAgcmV0dXJuIGNtcFBvcyhhLCBiKSA8IDAgPyBhIDogYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmFuZ2VzSW50ZXJzZWN0cyhcbiAgYTogW1Bvc2l0aW9uLCBQb3NpdGlvbl0sXG4gIGI6IFtQb3NpdGlvbiwgUG9zaXRpb25dXG4pIHtcbiAgcmV0dXJuIGNtcFBvcyhhWzFdLCBiWzBdKSA+PSAwICYmIGNtcFBvcyhhWzBdLCBiWzFdKSA8PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyhyb290OiBSb290KSB7XG4gIGZ1bmN0aW9uIHZpc2l0KHBhcmVudDogUm9vdCB8IExpc3QpIHtcbiAgICBsZXQgaW5kZXggPSAxO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBwYXJlbnQuZ2V0Q2hpbGRyZW4oKSkge1xuICAgICAgaWYgKC9cXGQrXFwuLy50ZXN0KGNoaWxkLmdldEJ1bGxldCgpKSkge1xuICAgICAgICBjaGlsZC5yZXBsYXRlQnVsbGV0KGAke2luZGV4Kyt9LmApO1xuICAgICAgfVxuXG4gICAgICB2aXNpdChjaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgdmlzaXQocm9vdCk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUG9zaXRpb24ge1xuICBjaDogbnVtYmVyO1xuICBsaW5lOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdExpbmUge1xuICB0ZXh0OiBzdHJpbmc7XG4gIGZyb206IFBvc2l0aW9uO1xuICB0bzogUG9zaXRpb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmFuZ2Uge1xuICBhbmNob3I6IFBvc2l0aW9uO1xuICBoZWFkOiBQb3NpdGlvbjtcbn1cblxubGV0IGlkU2VxID0gMDtcblxuZXhwb3J0IGNsYXNzIExpc3Qge1xuICBwcml2YXRlIGlkOiBudW1iZXI7XG4gIHByaXZhdGUgcGFyZW50OiBMaXN0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY2hpbGRyZW46IExpc3RbXSA9IFtdO1xuICBwcml2YXRlIG5vdGVzSW5kZW50OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsaW5lczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJvb3Q6IFJvb3QsXG4gICAgcHJpdmF0ZSBpbmRlbnQ6IHN0cmluZyxcbiAgICBwcml2YXRlIGJ1bGxldDogc3RyaW5nLFxuICAgIHByaXZhdGUgb3B0aW9uYWxDaGVja2JveDogc3RyaW5nLFxuICAgIHByaXZhdGUgc3BhY2VBZnRlckJ1bGxldDogc3RyaW5nLFxuICAgIGZpcnN0TGluZTogc3RyaW5nLFxuICAgIHByaXZhdGUgZm9sZFJvb3Q6IGJvb2xlYW5cbiAgKSB7XG4gICAgdGhpcy5pZCA9IGlkU2VxKys7XG4gICAgdGhpcy5saW5lcy5wdXNoKGZpcnN0TGluZSk7XG4gIH1cblxuICBnZXRJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbiAgfVxuXG4gIGdldE5vdGVzSW5kZW50KCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLm5vdGVzSW5kZW50O1xuICB9XG5cbiAgc2V0Tm90ZXNJbmRlbnQobm90ZXNJbmRlbnQ6IHN0cmluZykge1xuICAgIGlmICh0aGlzLm5vdGVzSW5kZW50ICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdGVzIGluZGVudCBhbHJlYWR5IHByb3ZpZGVkYCk7XG4gICAgfVxuICAgIHRoaXMubm90ZXNJbmRlbnQgPSBub3Rlc0luZGVudDtcbiAgfVxuXG4gIGFkZExpbmUodGV4dDogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMubm90ZXNJbmRlbnQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFVuYWJsZSB0byBhZGQgbGluZSwgbm90ZXMgaW5kZW50IHNob3VsZCBiZSBwcm92aWRlZCBmaXJzdGBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5saW5lcy5wdXNoKHRleHQpO1xuICB9XG5cbiAgcmVwbGFjZUxpbmVzKGxpbmVzOiBzdHJpbmdbXSkge1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAxICYmIHRoaXMubm90ZXNJbmRlbnQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFVuYWJsZSB0byBhZGQgbGluZSwgbm90ZXMgaW5kZW50IHNob3VsZCBiZSBwcm92aWRlZCBmaXJzdGBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5saW5lcyA9IGxpbmVzO1xuICB9XG5cbiAgZ2V0TGluZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmxpbmVzLmxlbmd0aDtcbiAgfVxuXG4gIGdldFJvb3QoKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdDtcbiAgfVxuXG4gIGdldENoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmNvbmNhdCgpO1xuICB9XG5cbiAgZ2V0TGluZXNJbmZvKCk6IExpc3RMaW5lW10ge1xuICAgIGNvbnN0IHN0YXJ0TGluZSA9IHRoaXMucm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKHRoaXMpWzBdO1xuXG4gICAgcmV0dXJuIHRoaXMubGluZXMubWFwKChyb3csIGkpID0+IHtcbiAgICAgIGNvbnN0IGxpbmUgPSBzdGFydExpbmUgKyBpO1xuICAgICAgY29uc3Qgc3RhcnRDaCA9XG4gICAgICAgIGkgPT09IDAgPyB0aGlzLmdldENvbnRlbnRTdGFydENoKCkgOiB0aGlzLm5vdGVzSW5kZW50Lmxlbmd0aDtcbiAgICAgIGNvbnN0IGVuZENoID0gc3RhcnRDaCArIHJvdy5sZW5ndGg7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IHJvdyxcbiAgICAgICAgZnJvbTogeyBsaW5lLCBjaDogc3RhcnRDaCB9LFxuICAgICAgICB0bzogeyBsaW5lLCBjaDogZW5kQ2ggfSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBnZXRMaW5lcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubGluZXMuY29uY2F0KCk7XG4gIH1cblxuICBnZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKSB7XG4gICAgY29uc3Qgc3RhcnRMaW5lID0gdGhpcy5yb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YodGhpcylbMF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGluZTogc3RhcnRMaW5lLFxuICAgICAgY2g6IHRoaXMuZ2V0Q29udGVudFN0YXJ0Q2goKSxcbiAgICB9O1xuICB9XG5cbiAgZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0QWZ0ZXJDaGVja2JveCgpIHtcbiAgICBjb25zdCBzdGFydExpbmUgPSB0aGlzLnJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZih0aGlzKVswXTtcblxuICAgIHJldHVybiB7XG4gICAgICBsaW5lOiBzdGFydExpbmUsXG4gICAgICBjaDogdGhpcy5nZXRDb250ZW50U3RhcnRDaCgpICsgdGhpcy5nZXRDaGVja2JveExlbmd0aCgpLFxuICAgIH07XG4gIH1cblxuICBnZXRMYXN0TGluZUNvbnRlbnRFbmQoKSB7XG4gICAgY29uc3QgZW5kTGluZSA9IHRoaXMucm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKHRoaXMpWzFdO1xuICAgIGNvbnN0IGVuZENoID1cbiAgICAgIHRoaXMubGluZXMubGVuZ3RoID09PSAxXG4gICAgICAgID8gdGhpcy5nZXRDb250ZW50U3RhcnRDaCgpICsgdGhpcy5saW5lc1swXS5sZW5ndGhcbiAgICAgICAgOiB0aGlzLm5vdGVzSW5kZW50Lmxlbmd0aCArIHRoaXMubGluZXNbdGhpcy5saW5lcy5sZW5ndGggLSAxXS5sZW5ndGg7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGluZTogZW5kTGluZSxcbiAgICAgIGNoOiBlbmRDaCxcbiAgICB9O1xuICB9XG5cbiAgZ2V0Q29udGVudEVuZEluY2x1ZGluZ0NoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLmdldExhc3RDaGlsZCgpLmdldExhc3RMaW5lQ29udGVudEVuZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRMYXN0Q2hpbGQoKSB7XG4gICAgbGV0IGxhc3RDaGlsZDogTGlzdCA9IHRoaXM7XG5cbiAgICB3aGlsZSAoIWxhc3RDaGlsZC5pc0VtcHR5KCkpIHtcbiAgICAgIGxhc3RDaGlsZCA9IGxhc3RDaGlsZC5nZXRDaGlsZHJlbigpLmxhc3QoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGFzdENoaWxkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb250ZW50U3RhcnRDaCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbmRlbnQubGVuZ3RoICsgdGhpcy5idWxsZXQubGVuZ3RoICsgMTtcbiAgfVxuXG4gIGlzRm9sZGVkKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLmZvbGRSb290KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcmVudC5pc0ZvbGRlZCgpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlzRm9sZFJvb3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9sZFJvb3Q7XG4gIH1cblxuICBnZXRUb3BGb2xkUm9vdCgpIHtcbiAgICBsZXQgdG1wOiBMaXN0ID0gdGhpcztcbiAgICBsZXQgZm9sZFJvb3Q6IExpc3QgfCBudWxsID0gbnVsbDtcbiAgICB3aGlsZSAodG1wKSB7XG4gICAgICBpZiAodG1wLmlzRm9sZFJvb3QoKSkge1xuICAgICAgICBmb2xkUm9vdCA9IHRtcDtcbiAgICAgIH1cbiAgICAgIHRtcCA9IHRtcC5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBmb2xkUm9vdDtcbiAgfVxuXG4gIGdldExldmVsKCk6IG51bWJlciB7XG4gICAgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50LmdldExldmVsKCkgKyAxO1xuICB9XG5cbiAgdW5pbmRlbnRDb250ZW50KGZyb206IG51bWJlciwgdGlsbDogbnVtYmVyKSB7XG4gICAgdGhpcy5pbmRlbnQgPSB0aGlzLmluZGVudC5zbGljZSgwLCBmcm9tKSArIHRoaXMuaW5kZW50LnNsaWNlKHRpbGwpO1xuICAgIGlmICh0aGlzLm5vdGVzSW5kZW50ICE9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vdGVzSW5kZW50ID1cbiAgICAgICAgdGhpcy5ub3Rlc0luZGVudC5zbGljZSgwLCBmcm9tKSArIHRoaXMubm90ZXNJbmRlbnQuc2xpY2UodGlsbCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjaGlsZC51bmluZGVudENvbnRlbnQoZnJvbSwgdGlsbCk7XG4gICAgfVxuICB9XG5cbiAgaW5kZW50Q29udGVudChpbmRlbnRQb3M6IG51bWJlciwgaW5kZW50Q2hhcnM6IHN0cmluZykge1xuICAgIHRoaXMuaW5kZW50ID1cbiAgICAgIHRoaXMuaW5kZW50LnNsaWNlKDAsIGluZGVudFBvcykgK1xuICAgICAgaW5kZW50Q2hhcnMgK1xuICAgICAgdGhpcy5pbmRlbnQuc2xpY2UoaW5kZW50UG9zKTtcbiAgICBpZiAodGhpcy5ub3Rlc0luZGVudCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3Rlc0luZGVudCA9XG4gICAgICAgIHRoaXMubm90ZXNJbmRlbnQuc2xpY2UoMCwgaW5kZW50UG9zKSArXG4gICAgICAgIGluZGVudENoYXJzICtcbiAgICAgICAgdGhpcy5ub3Rlc0luZGVudC5zbGljZShpbmRlbnRQb3MpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY2hpbGQuaW5kZW50Q29udGVudChpbmRlbnRQb3MsIGluZGVudENoYXJzKTtcbiAgICB9XG4gIH1cblxuICBnZXRGaXJzdExpbmVJbmRlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5kZW50O1xuICB9XG5cbiAgZ2V0QnVsbGV0KCkge1xuICAgIHJldHVybiB0aGlzLmJ1bGxldDtcbiAgfVxuXG4gIGdldFNwYWNlQWZ0ZXJCdWxsZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3BhY2VBZnRlckJ1bGxldDtcbiAgfVxuXG4gIGdldENoZWNrYm94TGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbmFsQ2hlY2tib3gubGVuZ3RoO1xuICB9XG5cbiAgcmVwbGF0ZUJ1bGxldChidWxsZXQ6IHN0cmluZykge1xuICAgIHRoaXMuYnVsbGV0ID0gYnVsbGV0O1xuICB9XG5cbiAgZ2V0UGFyZW50KCkge1xuICAgIHJldHVybiB0aGlzLnBhcmVudDtcbiAgfVxuXG4gIGFkZEJlZm9yZUFsbChsaXN0OiBMaXN0KSB7XG4gICAgdGhpcy5jaGlsZHJlbi51bnNoaWZ0KGxpc3QpO1xuICAgIGxpc3QucGFyZW50ID0gdGhpcztcbiAgfVxuXG4gIGFkZEFmdGVyQWxsKGxpc3Q6IExpc3QpIHtcbiAgICB0aGlzLmNoaWxkcmVuLnB1c2gobGlzdCk7XG4gICAgbGlzdC5wYXJlbnQgPSB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQobGlzdDogTGlzdCkge1xuICAgIGNvbnN0IGkgPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YobGlzdCk7XG4gICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoaSwgMSk7XG4gICAgbGlzdC5wYXJlbnQgPSBudWxsO1xuICB9XG5cbiAgYWRkQmVmb3JlKGJlZm9yZTogTGlzdCwgbGlzdDogTGlzdCkge1xuICAgIGNvbnN0IGkgPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYmVmb3JlKTtcbiAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShpLCAwLCBsaXN0KTtcbiAgICBsaXN0LnBhcmVudCA9IHRoaXM7XG4gIH1cblxuICBhZGRBZnRlcihiZWZvcmU6IExpc3QsIGxpc3Q6IExpc3QpIHtcbiAgICBjb25zdCBpID0gdGhpcy5jaGlsZHJlbi5pbmRleE9mKGJlZm9yZSk7XG4gICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoaSArIDEsIDAsIGxpc3QpO1xuICAgIGxpc3QucGFyZW50ID0gdGhpcztcbiAgfVxuXG4gIGdldFByZXZTaWJsaW5nT2YobGlzdDogTGlzdCkge1xuICAgIGNvbnN0IGkgPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YobGlzdCk7XG4gICAgcmV0dXJuIGkgPiAwID8gdGhpcy5jaGlsZHJlbltpIC0gMV0gOiBudWxsO1xuICB9XG5cbiAgZ2V0TmV4dFNpYmxpbmdPZihsaXN0OiBMaXN0KSB7XG4gICAgY29uc3QgaSA9IHRoaXMuY2hpbGRyZW4uaW5kZXhPZihsaXN0KTtcbiAgICByZXR1cm4gaSA+PSAwICYmIGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aCA/IHRoaXMuY2hpbGRyZW5baSArIDFdIDogbnVsbDtcbiAgfVxuXG4gIGlzRW1wdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID09PSAwO1xuICB9XG5cbiAgcHJpbnQoKSB7XG4gICAgbGV0IHJlcyA9IFwiXCI7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlcyArPVxuICAgICAgICBpID09PSAwXG4gICAgICAgICAgPyB0aGlzLmluZGVudCArIHRoaXMuYnVsbGV0ICsgdGhpcy5zcGFjZUFmdGVyQnVsbGV0XG4gICAgICAgICAgOiB0aGlzLm5vdGVzSW5kZW50O1xuICAgICAgcmVzICs9IHRoaXMubGluZXNbaV07XG4gICAgICByZXMgKz0gXCJcXG5cIjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIHJlcyArPSBjaGlsZC5wcmludCgpO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICBjbG9uZShuZXdSb290OiBSb290KSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgTGlzdChcbiAgICAgIG5ld1Jvb3QsXG4gICAgICB0aGlzLmluZGVudCxcbiAgICAgIHRoaXMuYnVsbGV0LFxuICAgICAgdGhpcy5vcHRpb25hbENoZWNrYm94LFxuICAgICAgdGhpcy5zcGFjZUFmdGVyQnVsbGV0LFxuICAgICAgXCJcIixcbiAgICAgIHRoaXMuZm9sZFJvb3RcbiAgICApO1xuICAgIGNsb25lLmlkID0gdGhpcy5pZDtcbiAgICBjbG9uZS5saW5lcyA9IHRoaXMubGluZXMuY29uY2F0KCk7XG4gICAgY2xvbmUubm90ZXNJbmRlbnQgPSB0aGlzLm5vdGVzSW5kZW50O1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY2xvbmUuYWRkQWZ0ZXJBbGwoY2hpbGQuY2xvbmUobmV3Um9vdCkpO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUm9vdCB7XG4gIHByaXZhdGUgcm9vdExpc3QgPSBuZXcgTGlzdCh0aGlzLCBcIlwiLCBcIlwiLCBcIlwiLCBcIlwiLCBcIlwiLCBmYWxzZSk7XG4gIHByaXZhdGUgc2VsZWN0aW9uczogUmFuZ2VbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgc3RhcnQ6IFBvc2l0aW9uLFxuICAgIHByaXZhdGUgZW5kOiBQb3NpdGlvbixcbiAgICBzZWxlY3Rpb25zOiBSYW5nZVtdXG4gICkge1xuICAgIHRoaXMucmVwbGFjZVNlbGVjdGlvbnMoc2VsZWN0aW9ucyk7XG4gIH1cblxuICBnZXRSb290TGlzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290TGlzdDtcbiAgfVxuXG4gIGdldENvbnRlbnRSYW5nZSgpOiBbUG9zaXRpb24sIFBvc2l0aW9uXSB7XG4gICAgcmV0dXJuIFt0aGlzLmdldENvbnRlbnRTdGFydCgpLCB0aGlzLmdldENvbnRlbnRFbmQoKV07XG4gIH1cblxuICBnZXRDb250ZW50U3RhcnQoKTogUG9zaXRpb24ge1xuICAgIHJldHVybiB7IC4uLnRoaXMuc3RhcnQgfTtcbiAgfVxuXG4gIGdldENvbnRlbnRFbmQoKTogUG9zaXRpb24ge1xuICAgIHJldHVybiB7IC4uLnRoaXMuZW5kIH07XG4gIH1cblxuICBnZXRTZWxlY3Rpb25zKCk6IFJhbmdlW10ge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbnMubWFwKChzKSA9PiAoe1xuICAgICAgYW5jaG9yOiB7IC4uLnMuYW5jaG9yIH0sXG4gICAgICBoZWFkOiB7IC4uLnMuaGVhZCB9LFxuICAgIH0pKTtcbiAgfVxuXG4gIGhhc1NpbmdsZUN1cnNvcigpIHtcbiAgICBpZiAoIXRoaXMuaGFzU2luZ2xlU2VsZWN0aW9uKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3Rpb24gPSB0aGlzLnNlbGVjdGlvbnNbMF07XG5cbiAgICByZXR1cm4gKFxuICAgICAgc2VsZWN0aW9uLmFuY2hvci5saW5lID09PSBzZWxlY3Rpb24uaGVhZC5saW5lICYmXG4gICAgICBzZWxlY3Rpb24uYW5jaG9yLmNoID09PSBzZWxlY3Rpb24uaGVhZC5jaFxuICAgICk7XG4gIH1cblxuICBoYXNTaW5nbGVTZWxlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9ucy5sZW5ndGggPT09IDE7XG4gIH1cblxuICBnZXRTZWxlY3Rpb24oKSB7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb25zW3RoaXMuc2VsZWN0aW9ucy5sZW5ndGggLSAxXTtcblxuICAgIGNvbnN0IGZyb20gPVxuICAgICAgc2VsZWN0aW9uLmFuY2hvci5jaCA+IHNlbGVjdGlvbi5oZWFkLmNoXG4gICAgICAgID8gc2VsZWN0aW9uLmhlYWQuY2hcbiAgICAgICAgOiBzZWxlY3Rpb24uYW5jaG9yLmNoO1xuICAgIGNvbnN0IHRvID1cbiAgICAgIHNlbGVjdGlvbi5hbmNob3IuY2ggPiBzZWxlY3Rpb24uaGVhZC5jaFxuICAgICAgICA/IHNlbGVjdGlvbi5hbmNob3IuY2hcbiAgICAgICAgOiBzZWxlY3Rpb24uaGVhZC5jaDtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi5zZWxlY3Rpb24sXG4gICAgICBmcm9tLFxuICAgICAgdG8sXG4gICAgfTtcbiAgfVxuXG4gIGdldEN1cnNvcigpIHtcbiAgICByZXR1cm4geyAuLi50aGlzLnNlbGVjdGlvbnNbdGhpcy5zZWxlY3Rpb25zLmxlbmd0aCAtIDFdLmhlYWQgfTtcbiAgfVxuXG4gIHJlcGxhY2VDdXJzb3IoY3Vyc29yOiBQb3NpdGlvbikge1xuICAgIHRoaXMuc2VsZWN0aW9ucyA9IFt7IGFuY2hvcjogY3Vyc29yLCBoZWFkOiBjdXJzb3IgfV07XG4gIH1cblxuICByZXBsYWNlU2VsZWN0aW9ucyhzZWxlY3Rpb25zOiBSYW5nZVtdKSB7XG4gICAgaWYgKHNlbGVjdGlvbnMubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gY3JlYXRlIFJvb3Qgd2l0aG91dCBzZWxlY3Rpb25zYCk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0aW9ucyA9IHNlbGVjdGlvbnM7XG4gIH1cblxuICBnZXRMaXN0VW5kZXJDdXJzb3IoKTogTGlzdCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGlzdFVuZGVyTGluZSh0aGlzLmdldEN1cnNvcigpLmxpbmUpO1xuICB9XG5cbiAgZ2V0TGlzdFVuZGVyTGluZShsaW5lOiBudW1iZXIpIHtcbiAgICBpZiAobGluZSA8IHRoaXMuc3RhcnQubGluZSB8fCBsaW5lID4gdGhpcy5lbmQubGluZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQ6IExpc3QgPSBudWxsO1xuICAgIGxldCBpbmRleDogbnVtYmVyID0gdGhpcy5zdGFydC5saW5lO1xuXG4gICAgY29uc3QgdmlzaXRBcnIgPSAobGw6IExpc3RbXSkgPT4ge1xuICAgICAgZm9yIChjb25zdCBsIG9mIGxsKSB7XG4gICAgICAgIGNvbnN0IGxpc3RGcm9tTGluZSA9IGluZGV4O1xuICAgICAgICBjb25zdCBsaXN0VGlsbExpbmUgPSBsaXN0RnJvbUxpbmUgKyBsLmdldExpbmVDb3VudCgpIC0gMTtcblxuICAgICAgICBpZiAobGluZSA+PSBsaXN0RnJvbUxpbmUgJiYgbGluZSA8PSBsaXN0VGlsbExpbmUpIHtcbiAgICAgICAgICByZXN1bHQgPSBsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4ID0gbGlzdFRpbGxMaW5lICsgMTtcbiAgICAgICAgICB2aXNpdEFycihsLmdldENoaWxkcmVuKCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmlzaXRBcnIodGhpcy5yb290TGlzdC5nZXRDaGlsZHJlbigpKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3Q6IExpc3QpOiBbbnVtYmVyLCBudW1iZXJdIHwgbnVsbCB7XG4gICAgbGV0IHJlc3VsdDogW251bWJlciwgbnVtYmVyXSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBsaW5lOiBudW1iZXIgPSB0aGlzLnN0YXJ0LmxpbmU7XG5cbiAgICBjb25zdCB2aXNpdEFyciA9IChsbDogTGlzdFtdKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGwgb2YgbGwpIHtcbiAgICAgICAgY29uc3QgbGlzdEZyb21MaW5lID0gbGluZTtcbiAgICAgICAgY29uc3QgbGlzdFRpbGxMaW5lID0gbGlzdEZyb21MaW5lICsgbC5nZXRMaW5lQ291bnQoKSAtIDE7XG5cbiAgICAgICAgaWYgKGwgPT09IGxpc3QpIHtcbiAgICAgICAgICByZXN1bHQgPSBbbGlzdEZyb21MaW5lLCBsaXN0VGlsbExpbmVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmUgPSBsaXN0VGlsbExpbmUgKyAxO1xuICAgICAgICAgIHZpc2l0QXJyKGwuZ2V0Q2hpbGRyZW4oKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZpc2l0QXJyKHRoaXMucm9vdExpc3QuZ2V0Q2hpbGRyZW4oKSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdExpc3QuZ2V0Q2hpbGRyZW4oKTtcbiAgfVxuXG4gIHByaW50KCkge1xuICAgIGxldCByZXMgPSBcIlwiO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLnJvb3RMaXN0LmdldENoaWxkcmVuKCkpIHtcbiAgICAgIHJlcyArPSBjaGlsZC5wcmludCgpO1xuICAgIH1cblxuICAgIHJldHVybiByZXMucmVwbGFjZSgvXFxuJC8sIFwiXCIpO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgUm9vdChcbiAgICAgIHsgLi4udGhpcy5zdGFydCB9LFxuICAgICAgeyAuLi50aGlzLmVuZCB9LFxuICAgICAgdGhpcy5nZXRTZWxlY3Rpb25zKClcbiAgICApO1xuICAgIGNsb25lLnJvb3RMaXN0ID0gdGhpcy5yb290TGlzdC5jbG9uZShjbG9uZSk7XG4gICAgcmV0dXJuIGNsb25lO1xuICB9XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHtcbiAgTGlzdCxcbiAgTGlzdExpbmUsXG4gIFBvc2l0aW9uLFxuICBSb290LFxuICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzLFxufSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgRGVsZXRlVGlsbFByZXZpb3VzTGluZUNvbnRlbnRFbmQgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBjdXJzb3IgPSByb290LmdldEN1cnNvcigpO1xuICAgIGNvbnN0IGxpbmVzID0gbGlzdC5nZXRMaW5lc0luZm8oKTtcblxuICAgIGNvbnN0IGxpbmVObyA9IGxpbmVzLmZpbmRJbmRleChcbiAgICAgIChsKSA9PiBjdXJzb3IuY2ggPT09IGwuZnJvbS5jaCAmJiBjdXJzb3IubGluZSA9PT0gbC5mcm9tLmxpbmVcbiAgICApO1xuXG4gICAgaWYgKGxpbmVObyA9PT0gMCkge1xuICAgICAgdGhpcy5tZXJnZVdpdGhQcmV2aW91c0l0ZW0ocm9vdCwgY3Vyc29yLCBsaXN0KTtcbiAgICB9IGVsc2UgaWYgKGxpbmVObyA+IDApIHtcbiAgICAgIHRoaXMubWVyZ2VOb3Rlcyhyb290LCBjdXJzb3IsIGxpc3QsIGxpbmVzLCBsaW5lTm8pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWVyZ2VOb3RlcyhcbiAgICByb290OiBSb290LFxuICAgIGN1cnNvcjogUG9zaXRpb24sXG4gICAgbGlzdDogTGlzdCxcbiAgICBsaW5lczogTGlzdExpbmVbXSxcbiAgICBsaW5lTm86IG51bWJlclxuICApIHtcbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IHByZXZMaW5lTm8gPSBsaW5lTm8gLSAxO1xuXG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKHtcbiAgICAgIGxpbmU6IGN1cnNvci5saW5lIC0gMSxcbiAgICAgIGNoOiBsaW5lc1twcmV2TGluZU5vXS50ZXh0Lmxlbmd0aCArIGxpbmVzW3ByZXZMaW5lTm9dLmZyb20uY2gsXG4gICAgfSk7XG5cbiAgICBsaW5lc1twcmV2TGluZU5vXS50ZXh0ICs9IGxpbmVzW2xpbmVOb10udGV4dDtcbiAgICBsaW5lcy5zcGxpY2UobGluZU5vLCAxKTtcblxuICAgIGxpc3QucmVwbGFjZUxpbmVzKGxpbmVzLm1hcCgobCkgPT4gbC50ZXh0KSk7XG4gIH1cblxuICBwcml2YXRlIG1lcmdlV2l0aFByZXZpb3VzSXRlbShyb290OiBSb290LCBjdXJzb3I6IFBvc2l0aW9uLCBsaXN0OiBMaXN0KSB7XG4gICAgaWYgKHJvb3QuZ2V0Q2hpbGRyZW4oKVswXSA9PT0gbGlzdCAmJiBsaXN0LmlzRW1wdHkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcblxuICAgIGNvbnN0IHByZXYgPSByb290LmdldExpc3RVbmRlckxpbmUoY3Vyc29yLmxpbmUgLSAxKTtcblxuICAgIGlmICghcHJldikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJvdGhBcmVFbXB0eSA9IHByZXYuaXNFbXB0eSgpICYmIGxpc3QuaXNFbXB0eSgpO1xuICAgIGNvbnN0IHByZXZJc0VtcHR5QW5kU2FtZUxldmVsID1cbiAgICAgIHByZXYuaXNFbXB0eSgpICYmICFsaXN0LmlzRW1wdHkoKSAmJiBwcmV2LmdldExldmVsKCkgPT09IGxpc3QuZ2V0TGV2ZWwoKTtcbiAgICBjb25zdCBsaXN0SXNFbXB0eUFuZFByZXZJc1BhcmVudCA9XG4gICAgICBsaXN0LmlzRW1wdHkoKSAmJiBwcmV2LmdldExldmVsKCkgPT09IGxpc3QuZ2V0TGV2ZWwoKSAtIDE7XG5cbiAgICBpZiAoYm90aEFyZUVtcHR5IHx8IHByZXZJc0VtcHR5QW5kU2FtZUxldmVsIHx8IGxpc3RJc0VtcHR5QW5kUHJldklzUGFyZW50KSB7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgICBjb25zdCBwYXJlbnQgPSBsaXN0LmdldFBhcmVudCgpO1xuICAgICAgY29uc3QgcHJldkVuZCA9IHByZXYuZ2V0TGFzdExpbmVDb250ZW50RW5kKCk7XG5cbiAgICAgIGlmICghcHJldi5nZXROb3Rlc0luZGVudCgpICYmIGxpc3QuZ2V0Tm90ZXNJbmRlbnQoKSkge1xuICAgICAgICBwcmV2LnNldE5vdGVzSW5kZW50KFxuICAgICAgICAgIHByZXYuZ2V0Rmlyc3RMaW5lSW5kZW50KCkgK1xuICAgICAgICAgICAgbGlzdC5nZXROb3Rlc0luZGVudCgpLnNsaWNlKGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvbGRMaW5lcyA9IHByZXYuZ2V0TGluZXMoKTtcbiAgICAgIGNvbnN0IG5ld0xpbmVzID0gbGlzdC5nZXRMaW5lcygpO1xuICAgICAgb2xkTGluZXNbb2xkTGluZXMubGVuZ3RoIC0gMV0gKz0gbmV3TGluZXNbMF07XG4gICAgICBjb25zdCByZXN1bHRMaW5lcyA9IG9sZExpbmVzLmNvbmNhdChuZXdMaW5lcy5zbGljZSgxKSk7XG5cbiAgICAgIHByZXYucmVwbGFjZUxpbmVzKHJlc3VsdExpbmVzKTtcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChsaXN0KTtcblxuICAgICAgZm9yIChjb25zdCBjIG9mIGxpc3QuZ2V0Q2hpbGRyZW4oKSkge1xuICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGMpO1xuICAgICAgICBwcmV2LmFkZEFmdGVyQWxsKGMpO1xuICAgICAgfVxuXG4gICAgICByb290LnJlcGxhY2VDdXJzb3IocHJldkVuZCk7XG5cbiAgICAgIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMocm9vdCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IERlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kIH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvRGVsZXRlVGlsbFByZXZpb3VzTGluZUNvbnRlbnRFbmRcIjtcbmltcG9ydCB7IElNRURldGVjdG9yIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIEJhY2tzcGFjZUJlaGF2aW91ck92ZXJyaWRlIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW5fMixcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIGltZURldGVjdG9yOiBJTUVEZXRlY3RvcixcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAga2V5bWFwLm9mKFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJCYWNrc3BhY2VcIixcbiAgICAgICAgICBydW46IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKHtcbiAgICAgICAgICAgIGNoZWNrOiB0aGlzLmNoZWNrLFxuICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHt9XG5cbiAgcHJpdmF0ZSBjaGVjayA9ICgpID0+IHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5zZXR0aW5ncy5rZWVwQ3Vyc29yV2l0aGluQ29udGVudCAhPT0gXCJuZXZlclwiICYmXG4gICAgICAhdGhpcy5pbWVEZXRlY3Rvci5pc09wZW5lZCgpXG4gICAgKTtcbiAgfTtcblxuICBwcml2YXRlIHJ1biA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT4gbmV3IERlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kKHJvb3QpLFxuICAgICAgZWRpdG9yXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE9ic2lkaWFuU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvT2JzaWRpYW5TZXR0aW5nc1wiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcblxuY29uc3QgQkVUVEVSX0xJU1RTX0JPRFlfQ0xBU1MgPSBcIm91dGxpbmVyLXBsdWdpbi1iZXR0ZXItbGlzdHNcIjtcblxuZXhwb3J0IGNsYXNzIEJldHRlckxpc3RzU3R5bGVzIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIHByaXZhdGUgdXBkYXRlQm9keUNsYXNzSW50ZXJ2YWw6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3NcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy51cGRhdGVCb2R5Q2xhc3MoKTtcbiAgICB0aGlzLnVwZGF0ZUJvZHlDbGFzc0ludGVydmFsID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMudXBkYXRlQm9keUNsYXNzKCk7XG4gICAgfSwgMTAwMCk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnVwZGF0ZUJvZHlDbGFzc0ludGVydmFsKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoQkVUVEVSX0xJU1RTX0JPRFlfQ0xBU1MpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVCb2R5Q2xhc3MgPSAoKSA9PiB7XG4gICAgY29uc3Qgc2hvdWxkRXhpc3RzID1cbiAgICAgIHRoaXMub2JzaWRpYW5TZXR0aW5ncy5pc0RlZmF1bHRUaGVtZUVuYWJsZWQoKSAmJlxuICAgICAgdGhpcy5zZXR0aW5ncy5iZXR0ZXJMaXN0c1N0eWxlcztcbiAgICBjb25zdCBleGlzdHMgPSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhCRVRURVJfTElTVFNfQk9EWV9DTEFTUyk7XG5cbiAgICBpZiAoc2hvdWxkRXhpc3RzICYmICFleGlzdHMpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChCRVRURVJfTElTVFNfQk9EWV9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKCFzaG91bGRFeGlzdHMgJiYgZXhpc3RzKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoQkVUVEVSX0xJU1RTX0JPRFlfQ0xBU1MpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290LCBtYXhQb3MsIG1pblBvcyB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBTZWxlY3RBbGxDb250ZW50IGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBSb290KSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZVNlbGVjdGlvbigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VsZWN0aW9uID0gcm9vdC5nZXRTZWxlY3Rpb25zKClbMF07XG4gICAgY29uc3QgW3Jvb3RTdGFydCwgcm9vdEVuZF0gPSByb290LmdldENvbnRlbnRSYW5nZSgpO1xuXG4gICAgY29uc3Qgc2VsZWN0aW9uRnJvbSA9IG1pblBvcyhzZWxlY3Rpb24uYW5jaG9yLCBzZWxlY3Rpb24uaGVhZCk7XG4gICAgY29uc3Qgc2VsZWN0aW9uVG8gPSBtYXhQb3Moc2VsZWN0aW9uLmFuY2hvciwgc2VsZWN0aW9uLmhlYWQpO1xuXG4gICAgaWYgKFxuICAgICAgc2VsZWN0aW9uRnJvbS5saW5lIDwgcm9vdFN0YXJ0LmxpbmUgfHxcbiAgICAgIHNlbGVjdGlvblRvLmxpbmUgPiByb290RW5kLmxpbmVcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBzZWxlY3Rpb25Gcm9tLmxpbmUgPT09IHJvb3RTdGFydC5saW5lICYmXG4gICAgICBzZWxlY3Rpb25Gcm9tLmNoID09PSByb290U3RhcnQuY2ggJiZcbiAgICAgIHNlbGVjdGlvblRvLmxpbmUgPT09IHJvb3RFbmQubGluZSAmJlxuICAgICAgc2VsZWN0aW9uVG8uY2ggPT09IHJvb3RFbmQuY2hcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBjb250ZW50U3RhcnQgPSBsaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydEFmdGVyQ2hlY2tib3goKTtcbiAgICBjb25zdCBjb250ZW50RW5kID0gbGlzdC5nZXRMYXN0TGluZUNvbnRlbnRFbmQoKTtcblxuICAgIGlmIChcbiAgICAgIHNlbGVjdGlvbkZyb20ubGluZSA8IGNvbnRlbnRTdGFydC5saW5lIHx8XG4gICAgICBzZWxlY3Rpb25Uby5saW5lID4gY29udGVudEVuZC5saW5lXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSB0cnVlO1xuICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG5cbiAgICBpZiAoXG4gICAgICBzZWxlY3Rpb25Gcm9tLmxpbmUgPT09IGNvbnRlbnRTdGFydC5saW5lICYmXG4gICAgICBzZWxlY3Rpb25Gcm9tLmNoID09PSBjb250ZW50U3RhcnQuY2ggJiZcbiAgICAgIHNlbGVjdGlvblRvLmxpbmUgPT09IGNvbnRlbnRFbmQubGluZSAmJlxuICAgICAgc2VsZWN0aW9uVG8uY2ggPT09IGNvbnRlbnRFbmQuY2hcbiAgICApIHtcbiAgICAgIC8vIHNlbGVjdCB3aG9sZSBsaXN0XG4gICAgICByb290LnJlcGxhY2VTZWxlY3Rpb25zKFt7IGFuY2hvcjogcm9vdFN0YXJ0LCBoZWFkOiByb290RW5kIH1dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2VsZWN0IHdob2xlIGxpbmVcbiAgICAgIHJvb3QucmVwbGFjZVNlbGVjdGlvbnMoW3sgYW5jaG9yOiBjb250ZW50U3RhcnQsIGhlYWQ6IGNvbnRlbnRFbmQgfV0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IFNlbGVjdEFsbENvbnRlbnQgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9TZWxlY3RBbGxDb250ZW50XCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9JTUVEZXRlY3RvclwiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcbmltcG9ydCB7IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrXCI7XG5cbmV4cG9ydCBjbGFzcyBDdHJsQUFuZENtZEFCZWhhdmlvdXJPdmVycmlkZSBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luXzIsXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBpbWVEZXRlY3RvcjogSU1FRGV0ZWN0b3IsXG4gICAgcHJpdmF0ZSBvcGVyYXRpb25QZXJmb3JtZXI6IE9wZXJhdGlvblBlcmZvcm1lclxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIGtleW1hcC5vZihbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwiYy1hXCIsXG4gICAgICAgICAgbWFjOiBcIm0tYVwiLFxuICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgY2hlY2s6IHRoaXMuY2hlY2ssXG4gICAgICAgICAgICBydW46IHRoaXMucnVuLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNoZWNrID0gKCkgPT4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLnNldHRpbmdzLm92ZXJyaWRlU2VsZWN0QWxsQmVoYXZpb3VyICYmICF0aGlzLmltZURldGVjdG9yLmlzT3BlbmVkKClcbiAgICApO1xuICB9O1xuXG4gIHByaXZhdGUgcnVuID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PiBuZXcgU2VsZWN0QWxsQ29udGVudChyb290KSxcbiAgICAgIGVkaXRvclxuICAgICk7XG4gIH07XG59XG4iLCJpbXBvcnQgeyBEZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZCB9IGZyb20gXCIuL0RlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kXCI7XG5pbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBEZWxldGVUaWxsTmV4dExpbmVDb250ZW50U3RhcnQgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIGRlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kOiBEZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHtcbiAgICB0aGlzLmRlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kID1cbiAgICAgIG5ldyBEZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZChyb290KTtcbiAgfVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZC5zaG91bGRTdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZC5zaG91bGRVcGRhdGUoKTtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZUN1cnNvcigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXNJbmZvKCk7XG5cbiAgICBjb25zdCBsaW5lTm8gPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgICAobCkgPT4gY3Vyc29yLmNoID09PSBsLnRvLmNoICYmIGN1cnNvci5saW5lID09PSBsLnRvLmxpbmVcbiAgICApO1xuXG4gICAgaWYgKGxpbmVObyA9PT0gbGluZXMubGVuZ3RoIC0gMSkge1xuICAgICAgY29uc3QgbmV4dExpbmUgPSBsaW5lc1tsaW5lTm9dLnRvLmxpbmUgKyAxO1xuICAgICAgY29uc3QgbmV4dExpc3QgPSByb290LmdldExpc3RVbmRlckxpbmUobmV4dExpbmUpO1xuICAgICAgaWYgKCFuZXh0TGlzdCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByb290LnJlcGxhY2VDdXJzb3IobmV4dExpc3QuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkpO1xuICAgICAgdGhpcy5kZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZC5wZXJmb3JtKCk7XG4gICAgfSBlbHNlIGlmIChsaW5lTm8gPj0gMCkge1xuICAgICAgcm9vdC5yZXBsYWNlQ3Vyc29yKGxpbmVzW2xpbmVObyArIDFdLmZyb20pO1xuICAgICAgdGhpcy5kZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZC5wZXJmb3JtKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IERlbGV0ZVRpbGxOZXh0TGluZUNvbnRlbnRTdGFydCB9IGZyb20gXCIuLi9vcGVyYXRpb25zL0RlbGV0ZVRpbGxOZXh0TGluZUNvbnRlbnRTdGFydFwiO1xuaW1wb3J0IHsgSU1FRGV0ZWN0b3IgfSBmcm9tIFwiLi4vc2VydmljZXMvSU1FRGV0ZWN0b3JcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgRGVsZXRlQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgaW1lRGV0ZWN0b3I6IElNRURldGVjdG9yLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXJcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oXG4gICAgICBrZXltYXAub2YoW1xuICAgICAgICB7XG4gICAgICAgICAga2V5OiBcIkRlbGV0ZVwiLFxuICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgY2hlY2s6IHRoaXMuY2hlY2ssXG4gICAgICAgICAgICBydW46IHRoaXMucnVuLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSlcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNoZWNrID0gKCkgPT4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLnNldHRpbmdzLmtlZXBDdXJzb3JXaXRoaW5Db250ZW50ICE9PSBcIm5ldmVyXCIgJiZcbiAgICAgICF0aGlzLmltZURldGVjdG9yLmlzT3BlbmVkKClcbiAgICApO1xuICB9O1xuXG4gIHByaXZhdGUgcnVuID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PiBuZXcgRGVsZXRlVGlsbE5leHRMaW5lQ29udGVudFN0YXJ0KHJvb3QpLFxuICAgICAgZWRpdG9yXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBMaXN0LCBSb290LCByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzIH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuaW50ZXJmYWNlIEN1cnNvckFuY2hvciB7XG4gIGN1cnNvckxpc3Q6IExpc3Q7XG4gIGxpbmVEaWZmOiBudW1iZXI7XG4gIGNoRGlmZjogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTW92ZUxpc3RUb0RpZmZlcmVudFBvc2l0aW9uIGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByb290OiBSb290LFxuICAgIHByaXZhdGUgbGlzdFRvTW92ZTogTGlzdCxcbiAgICBwcml2YXRlIHBsYWNlVG9Nb3ZlOiBMaXN0LFxuICAgIHByaXZhdGUgd2hlcmVUb01vdmU6IFwiYmVmb3JlXCIgfCBcImFmdGVyXCIgfCBcImluc2lkZVwiLFxuICAgIHByaXZhdGUgZGVmYXVsdEluZGVudENoYXJzOiBzdHJpbmdcbiAgKSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgaWYgKHRoaXMubGlzdFRvTW92ZSA9PT0gdGhpcy5wbGFjZVRvTW92ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgY3Vyc29yQW5jaG9yID0gdGhpcy5jYWxjdWxhdGVDdXJzb3JBbmNob3IoKTtcbiAgICB0aGlzLm1vdmVMaXN0KCk7XG4gICAgdGhpcy5jaGFuZ2VJbmRlbnQoKTtcbiAgICB0aGlzLnJlc3RvcmVDdXJzb3IoY3Vyc29yQW5jaG9yKTtcbiAgICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzKHRoaXMucm9vdCk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUN1cnNvckFuY2hvcigpOiBDdXJzb3JBbmNob3Ige1xuICAgIGNvbnN0IGN1cnNvckxpbmUgPSB0aGlzLnJvb3QuZ2V0Q3Vyc29yKCkubGluZTtcblxuICAgIGNvbnN0IGxpbmVzID0gW1xuICAgICAgdGhpcy5saXN0VG9Nb3ZlLmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUsXG4gICAgICB0aGlzLmxpc3RUb01vdmUuZ2V0TGFzdExpbmVDb250ZW50RW5kKCkubGluZSxcbiAgICAgIHRoaXMucGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSxcbiAgICAgIHRoaXMucGxhY2VUb01vdmUuZ2V0TGFzdExpbmVDb250ZW50RW5kKCkubGluZSxcbiAgICBdO1xuICAgIGNvbnN0IGxpc3RTdGFydExpbmUgPSBNYXRoLm1pbiguLi5saW5lcyk7XG4gICAgY29uc3QgbGlzdEVuZExpbmUgPSBNYXRoLm1heCguLi5saW5lcyk7XG5cbiAgICBpZiAoY3Vyc29yTGluZSA8IGxpc3RTdGFydExpbmUgfHwgY3Vyc29yTGluZSA+IGxpc3RFbmRMaW5lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLnJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgY3Vyc29yTGlzdCA9IHRoaXMucm9vdC5nZXRMaXN0VW5kZXJMaW5lKGN1cnNvci5saW5lKTtcbiAgICBjb25zdCBjdXJzb3JMaXN0U3RhcnQgPSBjdXJzb3JMaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpO1xuICAgIGNvbnN0IGxpbmVEaWZmID0gY3Vyc29yLmxpbmUgLSBjdXJzb3JMaXN0U3RhcnQubGluZTtcbiAgICBjb25zdCBjaERpZmYgPSBjdXJzb3IuY2ggLSBjdXJzb3JMaXN0U3RhcnQuY2g7XG5cbiAgICByZXR1cm4geyBjdXJzb3JMaXN0LCBsaW5lRGlmZiwgY2hEaWZmIH07XG4gIH1cblxuICBwcml2YXRlIG1vdmVMaXN0KCkge1xuICAgIHRoaXMubGlzdFRvTW92ZS5nZXRQYXJlbnQoKS5yZW1vdmVDaGlsZCh0aGlzLmxpc3RUb01vdmUpO1xuXG4gICAgc3dpdGNoICh0aGlzLndoZXJlVG9Nb3ZlKSB7XG4gICAgICBjYXNlIFwiYmVmb3JlXCI6XG4gICAgICAgIHRoaXMucGxhY2VUb01vdmVcbiAgICAgICAgICAuZ2V0UGFyZW50KClcbiAgICAgICAgICAuYWRkQmVmb3JlKHRoaXMucGxhY2VUb01vdmUsIHRoaXMubGlzdFRvTW92ZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiYWZ0ZXJcIjpcbiAgICAgICAgdGhpcy5wbGFjZVRvTW92ZVxuICAgICAgICAgIC5nZXRQYXJlbnQoKVxuICAgICAgICAgIC5hZGRBZnRlcih0aGlzLnBsYWNlVG9Nb3ZlLCB0aGlzLmxpc3RUb01vdmUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImluc2lkZVwiOlxuICAgICAgICB0aGlzLnBsYWNlVG9Nb3ZlLmFkZEJlZm9yZUFsbCh0aGlzLmxpc3RUb01vdmUpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoYW5nZUluZGVudCgpIHtcbiAgICBjb25zdCBvbGRJbmRlbnQgPSB0aGlzLmxpc3RUb01vdmUuZ2V0Rmlyc3RMaW5lSW5kZW50KCk7XG4gICAgY29uc3QgbmV3SW5kZW50ID1cbiAgICAgIHRoaXMud2hlcmVUb01vdmUgPT09IFwiaW5zaWRlXCJcbiAgICAgICAgPyB0aGlzLnBsYWNlVG9Nb3ZlLmdldEZpcnN0TGluZUluZGVudCgpICsgdGhpcy5kZWZhdWx0SW5kZW50Q2hhcnNcbiAgICAgICAgOiB0aGlzLnBsYWNlVG9Nb3ZlLmdldEZpcnN0TGluZUluZGVudCgpO1xuICAgIHRoaXMubGlzdFRvTW92ZS51bmluZGVudENvbnRlbnQoMCwgb2xkSW5kZW50Lmxlbmd0aCk7XG4gICAgdGhpcy5saXN0VG9Nb3ZlLmluZGVudENvbnRlbnQoMCwgbmV3SW5kZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzdG9yZUN1cnNvcihjdXJzb3JBbmNob3I6IEN1cnNvckFuY2hvcikge1xuICAgIGlmIChjdXJzb3JBbmNob3IpIHtcbiAgICAgIGNvbnN0IGN1cnNvckxpc3RTdGFydCA9XG4gICAgICAgIGN1cnNvckFuY2hvci5jdXJzb3JMaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpO1xuXG4gICAgICB0aGlzLnJvb3QucmVwbGFjZUN1cnNvcih7XG4gICAgICAgIGxpbmU6IGN1cnNvckxpc3RTdGFydC5saW5lICsgY3Vyc29yQW5jaG9yLmxpbmVEaWZmLFxuICAgICAgICBjaDogY3Vyc29yTGlzdFN0YXJ0LmNoICsgY3Vyc29yQW5jaG9yLmNoRGlmZixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaGVuIHlvdSBtb3ZlIGEgbGlzdCwgdGhlIHNjcmVlbiBzY3JvbGxzIHRvIHRoZSBjdXJzb3IuXG4gICAgICAvLyBJdCBpcyBiZXR0ZXIgdG8gbW92ZSB0aGUgY3Vyc29yIGludG8gdGhlIHZpZXdwb3J0IHRoYW4gbGV0IHRoZSBzY3JlZW4gc2Nyb2xsLlxuICAgICAgdGhpcy5yb290LnJlcGxhY2VDdXJzb3IodGhpcy5saXN0VG9Nb3ZlLmdldExhc3RMaW5lQ29udGVudEVuZCgpKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IE5vdGljZSwgUGxhdGZvcm0sIFBsdWdpbl8yIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IFN0YXRlRWZmZWN0LCBTdGF0ZUZpZWxkIH0gZnJvbSBcIkBjb2RlbWlycm9yL3N0YXRlXCI7XG5pbXBvcnQgeyBEZWNvcmF0aW9uLCBEZWNvcmF0aW9uU2V0LCBFZGl0b3JWaWV3IH0gZnJvbSBcIkBjb2RlbWlycm9yL3ZpZXdcIjtcblxuaW1wb3J0IHsgRmVhdHVyZSB9IGZyb20gXCIuL0ZlYXR1cmVcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IsIGdldEVkaXRvckZyb21TdGF0ZSB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IE1vdmVMaXN0VG9EaWZmZXJlbnRQb3NpdGlvbiB9IGZyb20gXCIuLi9vcGVyYXRpb25zL01vdmVMaXN0VG9EaWZmZXJlbnRQb3NpdGlvblwiO1xuaW1wb3J0IHsgTGlzdCwgUm9vdCwgY21wUG9zIH0gZnJvbSBcIi4uL3Jvb3RcIjtcbmltcG9ydCB7IE9ic2lkaWFuU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvT2JzaWRpYW5TZXR0aW5nc1wiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lclwiO1xuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1BhcnNlclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcblxuY29uc3QgQk9EWV9DTEFTUyA9IFwib3V0bGluZXItcGx1Z2luLWRuZFwiO1xuXG5leHBvcnQgY2xhc3MgRHJhZ0FuZERyb3AgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgcHJpdmF0ZSBkcm9wWm9uZTogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgcHJlU3RhcnQ6IERyYWdBbmREcm9wUHJlU3RhcnRTdGF0ZSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0YXRlOiBEcmFnQW5kRHJvcFN0YXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb2Jpc2lkaWFuOiBPYnNpZGlhblNldHRpbmdzLFxuICAgIHByaXZhdGUgcGFyc2VyOiBQYXJzZXIsXG4gICAgcHJpdmF0ZSBvcGVyYXRpb25QZXJmb3JtZXI6IE9wZXJhdGlvblBlcmZvcm1lclxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihkbmRTdGF0ZUZpZWxkKTtcbiAgICB0aGlzLmVuYWJsZUZlYXR1cmVUb2dnbGUoKTtcbiAgICB0aGlzLmNyZWF0ZURyb3Bab25lKCk7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLnJlbW92ZURyb3Bab25lKCk7XG4gICAgdGhpcy5kaXNhYmxlRmVhdHVyZVRvZ2dsZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBlbmFibGVGZWF0dXJlVG9nZ2xlKCkge1xuICAgIHRoaXMuc2V0dGluZ3Mub25DaGFuZ2UodGhpcy5oYW5kbGVTZXR0aW5nc0NoYW5nZSk7XG4gICAgdGhpcy5oYW5kbGVTZXR0aW5nc0NoYW5nZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBkaXNhYmxlRmVhdHVyZVRvZ2dsZSgpIHtcbiAgICB0aGlzLnNldHRpbmdzLnJlbW92ZUNhbGxiYWNrKHRoaXMuaGFuZGxlU2V0dGluZ3NDaGFuZ2UpO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShCT0RZX0NMQVNTKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRHJvcFpvbmUoKSB7XG4gICAgdGhpcy5kcm9wWm9uZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5kcm9wWm9uZS5jbGFzc0xpc3QuYWRkKFwib3V0bGluZXItcGx1Z2luLWRyb3Atem9uZVwiKTtcbiAgICB0aGlzLmRyb3Bab25lLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZHJvcFpvbmUpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVEcm9wWm9uZSgpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMuZHJvcFpvbmUpO1xuICAgIHRoaXMuZHJvcFpvbmUgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRFdmVudExpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuaGFuZGxlTW91c2VEb3duLCB7XG4gICAgICBjYXB0dXJlOiB0cnVlLFxuICAgIH0pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5oYW5kbGVNb3VzZU1vdmUpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMuaGFuZGxlTW91c2VVcCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLmhhbmRsZU1vdXNlRG93biwge1xuICAgICAgY2FwdHVyZTogdHJ1ZSxcbiAgICB9KTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMuaGFuZGxlTW91c2VNb3ZlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLmhhbmRsZU1vdXNlVXApO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlS2V5RG93bik7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZVNldHRpbmdzQ2hhbmdlID0gKCkgPT4ge1xuICAgIGlmICghaXNGZWF0dXJlU3VwcG9ydGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5kcmFnQW5kRHJvcCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKEJPRFlfQ0xBU1MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoQk9EWV9DTEFTUyk7XG4gICAgfVxuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlTW91c2VEb3duID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICBpZiAoXG4gICAgICAhaXNGZWF0dXJlU3VwcG9ydGVkKCkgfHxcbiAgICAgICF0aGlzLnNldHRpbmdzLmRyYWdBbmREcm9wIHx8XG4gICAgICAhaXNDbGlja09uQnVsbGV0KGUpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdmlldyA9IGdldEVkaXRvclZpZXdGcm9tSFRNTEVsZW1lbnQoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGlmICghdmlldykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucHJlU3RhcnQgPSB7XG4gICAgICB4OiBlLngsXG4gICAgICB5OiBlLnksXG4gICAgICB2aWV3LFxuICAgIH07XG4gIH07XG5cbiAgcHJpdmF0ZSBoYW5kbGVNb3VzZU1vdmUgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgIGlmICh0aGlzLnByZVN0YXJ0KSB7XG4gICAgICB0aGlzLnN0YXJ0RHJhZ2dpbmcoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdGUpIHtcbiAgICAgIHRoaXMuZGV0ZWN0QW5kRHJhd0Ryb3Bab25lKGUueCwgZS55KTtcbiAgICB9XG4gIH07XG5cbiAgcHJpdmF0ZSBoYW5kbGVNb3VzZVVwID0gKCkgPT4ge1xuICAgIGlmICh0aGlzLnByZVN0YXJ0KSB7XG4gICAgICB0aGlzLnByZVN0YXJ0ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdGUpIHtcbiAgICAgIHRoaXMuc3RvcERyYWdnaW5nKCk7XG4gICAgfVxuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuc3RhdGUgJiYgZS5jb2RlID09PSBcIkVzY2FwZVwiKSB7XG4gICAgICB0aGlzLmNhbmNlbERyYWdnaW5nKCk7XG4gICAgfVxuICB9O1xuXG4gIHByaXZhdGUgc3RhcnREcmFnZ2luZygpIHtcbiAgICBjb25zdCB7IHgsIHksIHZpZXcgfSA9IHRoaXMucHJlU3RhcnQ7XG4gICAgdGhpcy5wcmVTdGFydCA9IG51bGw7XG5cbiAgICBjb25zdCBlZGl0b3IgPSBnZXRFZGl0b3JGcm9tU3RhdGUodmlldy5zdGF0ZSk7XG4gICAgY29uc3QgcG9zID0gZWRpdG9yLm9mZnNldFRvUG9zKHZpZXcucG9zQXRDb29yZHMoeyB4LCB5IH0pKTtcbiAgICBjb25zdCByb290ID0gdGhpcy5wYXJzZXIucGFyc2UoZWRpdG9yLCBwb3MpO1xuICAgIGNvbnN0IGxpc3QgPSByb290LmdldExpc3RVbmRlckxpbmUocG9zLmxpbmUpO1xuICAgIGNvbnN0IHN0YXRlID0gbmV3IERyYWdBbmREcm9wU3RhdGUodmlldywgZWRpdG9yLCByb290LCBsaXN0KTtcblxuICAgIGlmICghc3RhdGUuaGFzRHJvcFZhcmlhbnRzKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5oaWdobGlnaHREcmFnZ2luZ0xpbmVzKCk7XG4gIH1cblxuICBwcml2YXRlIGRldGVjdEFuZERyYXdEcm9wWm9uZSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgIHRoaXMuc3RhdGUuY2FsY3VsYXRlTmVhcmVzdERyb3BWYXJpYW50KHgsIHkpO1xuICAgIHRoaXMuZHJhd0Ryb3Bab25lKCk7XG4gIH1cblxuICBwcml2YXRlIGNhbmNlbERyYWdnaW5nKCkge1xuICAgIHRoaXMuc3RhdGUuZHJvcFZhcmlhbnQgPSBudWxsO1xuICAgIHRoaXMuc3RvcERyYWdnaW5nKCk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BEcmFnZ2luZygpIHtcbiAgICB0aGlzLnVuaGlnaHRsaWdodERyYWdnaW5nTGluZXMoKTtcbiAgICB0aGlzLmhpZGVEcm9wWm9uZSgpO1xuICAgIHRoaXMuYXBwbHlDaGFuZ2VzKCk7XG4gICAgdGhpcy5zdGF0ZSA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Q2hhbmdlcygpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZHJvcFZhcmlhbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7IHN0YXRlIH0gPSB0aGlzO1xuICAgIGNvbnN0IHsgZHJvcFZhcmlhbnQsIGVkaXRvciwgcm9vdCwgbGlzdCB9ID0gc3RhdGU7XG5cbiAgICBjb25zdCBuZXdSb290ID0gdGhpcy5wYXJzZXIucGFyc2UoZWRpdG9yLCByb290LmdldENvbnRlbnRTdGFydCgpKTtcbiAgICBpZiAoIWlzU2FtZVJvb3RzKHJvb3QsIG5ld1Jvb3QpKSB7XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgVGhlIGl0ZW0gY2Fubm90IGJlIG1vdmVkLiBUaGUgcGFnZSBjb250ZW50IGNoYW5nZWQgZHVyaW5nIHRoZSBtb3ZlLmAsXG4gICAgICAgIDUwMDBcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIuZXZhbChcbiAgICAgIHJvb3QsXG4gICAgICBuZXcgTW92ZUxpc3RUb0RpZmZlcmVudFBvc2l0aW9uKFxuICAgICAgICByb290LFxuICAgICAgICBsaXN0LFxuICAgICAgICBkcm9wVmFyaWFudC5wbGFjZVRvTW92ZSxcbiAgICAgICAgZHJvcFZhcmlhbnQud2hlcmVUb01vdmUsXG4gICAgICAgIHRoaXMub2Jpc2lkaWFuLmdldERlZmF1bHRJbmRlbnRDaGFycygpXG4gICAgICApLFxuICAgICAgZWRpdG9yXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgaGlnaGxpZ2h0RHJhZ2dpbmdMaW5lcygpIHtcbiAgICBjb25zdCB7IHN0YXRlIH0gPSB0aGlzO1xuICAgIGNvbnN0IHsgbGlzdCwgZWRpdG9yLCB2aWV3IH0gPSBzdGF0ZTtcblxuICAgIGNvbnN0IGxpbmVzID0gW107XG4gICAgY29uc3QgZnJvbUxpbmUgPSBsaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmU7XG4gICAgY29uc3QgdGlsbExpbmUgPSBsaXN0LmdldENvbnRlbnRFbmRJbmNsdWRpbmdDaGlsZHJlbigpLmxpbmU7XG4gICAgZm9yIChsZXQgaSA9IGZyb21MaW5lOyBpIDw9IHRpbGxMaW5lOyBpKyspIHtcbiAgICAgIGxpbmVzLnB1c2goZWRpdG9yLnBvc1RvT2Zmc2V0KHsgbGluZTogaSwgY2g6IDAgfSkpO1xuICAgIH1cbiAgICB2aWV3LmRpc3BhdGNoKHtcbiAgICAgIGVmZmVjdHM6IFtkbmRTdGFydGVkLm9mKGxpbmVzKV0sXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJvdXRsaW5lci1wbHVnaW4tZHJhZ2dpbmdcIik7XG4gIH1cblxuICBwcml2YXRlIHVuaGlnaHRsaWdodERyYWdnaW5nTGluZXMoKSB7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFwib3V0bGluZXItcGx1Z2luLWRyYWdnaW5nXCIpO1xuXG4gICAgdGhpcy5zdGF0ZS52aWV3LmRpc3BhdGNoKHtcbiAgICAgIGVmZmVjdHM6IFtkbmRFbmRlZC5vZigpXSxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZHJhd0Ryb3Bab25lKCkge1xuICAgIGNvbnN0IHsgc3RhdGUgfSA9IHRoaXM7XG4gICAgY29uc3QgeyB2aWV3LCBlZGl0b3IsIGxpc3QsIGRyb3BWYXJpYW50IH0gPSBzdGF0ZTtcblxuICAgIGNvbnN0IHdpZHRoID0gTWF0aC5yb3VuZChcbiAgICAgIHZpZXcuY29udGVudERPTS5vZmZzZXRXaWR0aCAtXG4gICAgICAgIChkcm9wVmFyaWFudC5sZWZ0IC1cbiAgICAgICAgICB2aWV3LmNvb3Jkc0F0UG9zKFxuICAgICAgICAgICAgZWRpdG9yLnBvc1RvT2Zmc2V0KHtcbiAgICAgICAgICAgICAgbGluZTogbGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lLFxuICAgICAgICAgICAgICBjaDogMCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKS5sZWZ0KVxuICAgICk7XG5cbiAgICB0aGlzLmRyb3Bab25lLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgdGhpcy5kcm9wWm9uZS5zdHlsZS50b3AgPSBkcm9wVmFyaWFudC50b3AgKyBcInB4XCI7XG4gICAgdGhpcy5kcm9wWm9uZS5zdHlsZS5sZWZ0ID0gZHJvcFZhcmlhbnQubGVmdCArIFwicHhcIjtcbiAgICB0aGlzLmRyb3Bab25lLnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG5cbiAgICBpZiAoXG4gICAgICBkcm9wVmFyaWFudC53aGVyZVRvTW92ZSA9PT0gXCJiZWZvcmVcIiAmJlxuICAgICAgIXRoaXMuZHJvcFpvbmUuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3V0bGluZXItcGx1Z2luLWRyb3Atem9uZS1iZWZvcmVcIilcbiAgICApIHtcbiAgICAgIHRoaXMuZHJvcFpvbmUuY2xhc3NMaXN0LnJlbW92ZShcIm91dGxpbmVyLXBsdWdpbi1kcm9wLXpvbmUtYWZ0ZXJcIik7XG4gICAgICB0aGlzLmRyb3Bab25lLmNsYXNzTGlzdC5hZGQoXCJvdXRsaW5lci1wbHVnaW4tZHJvcC16b25lLWJlZm9yZVwiKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKGRyb3BWYXJpYW50LndoZXJlVG9Nb3ZlID09PSBcImFmdGVyXCIgfHxcbiAgICAgICAgZHJvcFZhcmlhbnQud2hlcmVUb01vdmUgPT09IFwiaW5zaWRlXCIpICYmXG4gICAgICAhdGhpcy5kcm9wWm9uZS5jbGFzc0xpc3QuY29udGFpbnMoXCJvdXRsaW5lci1wbHVnaW4tZHJvcC16b25lLWFmdGVyXCIpXG4gICAgKSB7XG4gICAgICB0aGlzLmRyb3Bab25lLmNsYXNzTGlzdC5yZW1vdmUoXCJvdXRsaW5lci1wbHVnaW4tZHJvcC16b25lLWJlZm9yZVwiKTtcbiAgICAgIHRoaXMuZHJvcFpvbmUuY2xhc3NMaXN0LmFkZChcIm91dGxpbmVyLXBsdWdpbi1kcm9wLXpvbmUtYWZ0ZXJcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoaWRlRHJvcFpvbmUoKSB7XG4gICAgdGhpcy5kcm9wWm9uZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cbn1cblxuaW50ZXJmYWNlIERyb3BWYXJpYW50IHtcbiAgbGluZTogbnVtYmVyO1xuICBsZXZlbDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG4gIHRvcDogbnVtYmVyO1xuICBwbGFjZVRvTW92ZTogTGlzdDtcbiAgd2hlcmVUb01vdmU6IFwiYWZ0ZXJcIiB8IFwiYmVmb3JlXCIgfCBcImluc2lkZVwiO1xufVxuXG5pbnRlcmZhY2UgRHJhZ0FuZERyb3BQcmVTdGFydFN0YXRlIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG4gIHZpZXc6IEVkaXRvclZpZXc7XG59XG5cbmNsYXNzIERyYWdBbmREcm9wU3RhdGUge1xuICBwcml2YXRlIGRyb3BWYXJpYW50czogTWFwPHN0cmluZywgRHJvcFZhcmlhbnQ+ID0gbmV3IE1hcCgpO1xuICBwdWJsaWMgZHJvcFZhcmlhbnQ6IERyb3BWYXJpYW50ID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgdmlldzogRWRpdG9yVmlldyxcbiAgICBwdWJsaWMgcmVhZG9ubHkgZWRpdG9yOiBNeUVkaXRvcixcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm9vdDogUm9vdCxcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGlzdDogTGlzdFxuICApIHtcbiAgICB0aGlzLmNvbGxlY3REcm9wVmFyaWFudHMoKTtcbiAgfVxuXG4gIGdldERyb3BWYXJpYW50cygpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmRyb3BWYXJpYW50cy52YWx1ZXMoKSk7XG4gIH1cblxuICBoYXNEcm9wVmFyaWFudHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJvcFZhcmlhbnRzLnNpemUgPiAwO1xuICB9XG5cbiAgY2FsY3VsYXRlTmVhcmVzdERyb3BWYXJpYW50KHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgY29uc3QgeyB2aWV3LCBlZGl0b3IgfSA9IHRoaXM7XG5cbiAgICB0aGlzLmRyb3BWYXJpYW50ID0gdGhpcy5nZXREcm9wVmFyaWFudHMoKVxuICAgICAgLm1hcCgodikgPT4ge1xuICAgICAgICBjb25zdCB7IHBsYWNlVG9Nb3ZlIH0gPSB2O1xuXG4gICAgICAgIHN3aXRjaCAodi53aGVyZVRvTW92ZSkge1xuICAgICAgICAgIGNhc2UgXCJiZWZvcmVcIjpcbiAgICAgICAgICBjYXNlIFwiYWZ0ZXJcIjpcbiAgICAgICAgICAgIHYubGVmdCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgIHZpZXcuY29vcmRzQXRQb3MoXG4gICAgICAgICAgICAgICAgZWRpdG9yLnBvc1RvT2Zmc2V0KHtcbiAgICAgICAgICAgICAgICAgIGxpbmU6IHBsYWNlVG9Nb3ZlLmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUsXG4gICAgICAgICAgICAgICAgICBjaDogcGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICkubGVmdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBcImluc2lkZVwiOlxuICAgICAgICAgICAgdi5sZWZ0ID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAgICAgdmlldy5jb29yZHNBdFBvcyhcbiAgICAgICAgICAgICAgICBlZGl0b3IucG9zVG9PZmZzZXQoe1xuICAgICAgICAgICAgICAgICAgbGluZTogcGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSxcbiAgICAgICAgICAgICAgICAgIGNoOiBwbGFjZVRvTW92ZS5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKS5sZWZ0ICtcbiAgICAgICAgICAgICAgICB2aWV3LmRlZmF1bHRDaGFyYWN0ZXJXaWR0aCAqIDJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodi53aGVyZVRvTW92ZSkge1xuICAgICAgICAgIGNhc2UgXCJiZWZvcmVcIjpcbiAgICAgICAgICAgIHYudG9wID0gTWF0aC5yb3VuZChcbiAgICAgICAgICAgICAgdmlldy5jb29yZHNBdFBvcyhcbiAgICAgICAgICAgICAgICBlZGl0b3IucG9zVG9PZmZzZXQocGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkpXG4gICAgICAgICAgICAgICkudG9wXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIFwiYWZ0ZXJcIjpcbiAgICAgICAgICBjYXNlIFwiaW5zaWRlXCI6XG4gICAgICAgICAgICB2LnRvcCA9IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgIHZpZXcuY29vcmRzQXRQb3MoXG4gICAgICAgICAgICAgICAgZWRpdG9yLnBvc1RvT2Zmc2V0KHBsYWNlVG9Nb3ZlLmdldENvbnRlbnRFbmRJbmNsdWRpbmdDaGlsZHJlbigpKVxuICAgICAgICAgICAgICApLnRvcCArIHZpZXcuZGVmYXVsdExpbmVIZWlnaHRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2O1xuICAgICAgfSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIGlmIChhLnRvcCA9PT0gYi50b3ApIHtcbiAgICAgICAgICByZXR1cm4gTWF0aC5hYnMoeCAtIGEubGVmdCkgLSBNYXRoLmFicyh4IC0gYi5sZWZ0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLmFicyh5IC0gYS50b3ApIC0gTWF0aC5hYnMoeSAtIGIudG9wKTtcbiAgICAgIH0pXG4gICAgICAuZmlyc3QoKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkRHJvcFZhcmlhbnQodjogRHJvcFZhcmlhbnQpIHtcbiAgICB0aGlzLmRyb3BWYXJpYW50cy5zZXQoYCR7di5saW5lfSAke3YubGV2ZWx9YCwgdik7XG4gIH1cblxuICBwcml2YXRlIGNvbGxlY3REcm9wVmFyaWFudHMoKSB7XG4gICAgY29uc3QgdmlzaXQgPSAobGlzdHM6IExpc3RbXSkgPT4ge1xuICAgICAgZm9yIChjb25zdCBwbGFjZVRvTW92ZSBvZiBsaXN0cykge1xuICAgICAgICBjb25zdCBsaW5lQmVmb3JlID0gcGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZTtcbiAgICAgICAgY29uc3QgbGluZUFmdGVyID0gcGxhY2VUb01vdmUuZ2V0Q29udGVudEVuZEluY2x1ZGluZ0NoaWxkcmVuKCkubGluZSArIDE7XG5cbiAgICAgICAgY29uc3QgbGV2ZWwgPSBwbGFjZVRvTW92ZS5nZXRMZXZlbCgpO1xuXG4gICAgICAgIHRoaXMuYWRkRHJvcFZhcmlhbnQoe1xuICAgICAgICAgIGxpbmU6IGxpbmVCZWZvcmUsXG4gICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgcGxhY2VUb01vdmUsXG4gICAgICAgICAgd2hlcmVUb01vdmU6IFwiYmVmb3JlXCIsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZERyb3BWYXJpYW50KHtcbiAgICAgICAgICBsaW5lOiBsaW5lQWZ0ZXIsXG4gICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgcGxhY2VUb01vdmUsXG4gICAgICAgICAgd2hlcmVUb01vdmU6IFwiYWZ0ZXJcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHBsYWNlVG9Nb3ZlLmlzRW1wdHkoKSkge1xuICAgICAgICAgIHRoaXMuYWRkRHJvcFZhcmlhbnQoe1xuICAgICAgICAgICAgbGluZTogbGluZUFmdGVyLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsICsgMSxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICBwbGFjZVRvTW92ZSxcbiAgICAgICAgICAgIHdoZXJlVG9Nb3ZlOiBcImluc2lkZVwiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBsYWNlVG9Nb3ZlICE9PSB0aGlzLmxpc3QpIHtcbiAgICAgICAgICB2aXNpdChwbGFjZVRvTW92ZS5nZXRDaGlsZHJlbigpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB2aXNpdCh0aGlzLnJvb3QuZ2V0Q2hpbGRyZW4oKSk7XG4gIH1cbn1cblxuY29uc3QgZG5kU3RhcnRlZCA9IFN0YXRlRWZmZWN0LmRlZmluZTxudW1iZXJbXT4oe1xuICBtYXA6IChsaW5lcywgY2hhbmdlKSA9PiBsaW5lcy5tYXAoKGwpID0+IGNoYW5nZS5tYXBQb3MobCkpLFxufSk7XG5cbmNvbnN0IGRuZEVuZGVkID0gU3RhdGVFZmZlY3QuZGVmaW5lPHZvaWQ+KCk7XG5cbmNvbnN0IGRyYWdnaW5nTGluZURlY29yYXRpb24gPSBEZWNvcmF0aW9uLmxpbmUoe1xuICBjbGFzczogXCJvdXRsaW5lci1wbHVnaW4tZHJhZ2dpbmctbGluZVwiLFxufSk7XG5cbmNvbnN0IGRuZFN0YXRlRmllbGQgPSBTdGF0ZUZpZWxkLmRlZmluZTxEZWNvcmF0aW9uU2V0Pih7XG4gIGNyZWF0ZTogKCkgPT4gRGVjb3JhdGlvbi5ub25lLFxuXG4gIHVwZGF0ZTogKGRuZFN0YXRlLCB0cikgPT4ge1xuICAgIGRuZFN0YXRlID0gZG5kU3RhdGUubWFwKHRyLmNoYW5nZXMpO1xuXG4gICAgZm9yIChjb25zdCBlIG9mIHRyLmVmZmVjdHMpIHtcbiAgICAgIGlmIChlLmlzKGRuZFN0YXJ0ZWQpKSB7XG4gICAgICAgIGRuZFN0YXRlID0gZG5kU3RhdGUudXBkYXRlKHtcbiAgICAgICAgICBhZGQ6IGUudmFsdWUubWFwKChsKSA9PiBkcmFnZ2luZ0xpbmVEZWNvcmF0aW9uLnJhbmdlKGwsIGwpKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChlLmlzKGRuZEVuZGVkKSkge1xuICAgICAgICBkbmRTdGF0ZSA9IERlY29yYXRpb24ubm9uZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZG5kU3RhdGU7XG4gIH0sXG5cbiAgcHJvdmlkZTogKGYpID0+IEVkaXRvclZpZXcuZGVjb3JhdGlvbnMuZnJvbShmKSxcbn0pO1xuXG5mdW5jdGlvbiBnZXRFZGl0b3JWaWV3RnJvbUhUTUxFbGVtZW50KGU6IEhUTUxFbGVtZW50KSB7XG4gIHdoaWxlIChlICYmICFlLmNsYXNzTGlzdC5jb250YWlucyhcImNtLWVkaXRvclwiKSkge1xuICAgIGUgPSBlLnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICBpZiAoIWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBFZGl0b3JWaWV3LmZpbmRGcm9tRE9NKGUpO1xufVxuXG5mdW5jdGlvbiBpc0NsaWNrT25CdWxsZXQoZTogTW91c2VFdmVudCkge1xuICBsZXQgZWwgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcblxuICB3aGlsZSAoZWwpIHtcbiAgICBpZiAoXG4gICAgICBlbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjbS1mb3JtYXR0aW5nLWxpc3RcIikgfHxcbiAgICAgIGVsLmNsYXNzTGlzdC5jb250YWlucyhcImNtLWZvbGQtaW5kaWNhdG9yXCIpIHx8XG4gICAgICBlbC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0YXNrLWxpc3QtaXRlbS1jaGVja2JveFwiKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1NhbWVSb290cyhhOiBSb290LCBiOiBSb290KSB7XG4gIGNvbnN0IFthU3RhcnQsIGFFbmRdID0gYS5nZXRDb250ZW50UmFuZ2UoKTtcbiAgY29uc3QgW2JTdGFydCwgYkVuZF0gPSBiLmdldENvbnRlbnRSYW5nZSgpO1xuXG4gIGlmIChjbXBQb3MoYVN0YXJ0LCBiU3RhcnQpICE9PSAwIHx8IGNtcFBvcyhhRW5kLCBiRW5kKSAhPT0gMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBhLnByaW50KCkgPT09IGIucHJpbnQoKTtcbn1cblxuZnVuY3Rpb24gaXNGZWF0dXJlU3VwcG9ydGVkKCkge1xuICByZXR1cm4gUGxhdGZvcm0uaXNEZXNrdG9wO1xufVxuIiwiaW1wb3J0IHsgT3BlcmF0aW9uIH0gZnJvbSBcIi4vT3BlcmF0aW9uXCI7XG5cbmltcG9ydCB7IFJvb3QgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgS2VlcEN1cnNvck91dHNpZGVGb2xkZWRMaW5lcyBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogUm9vdCkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVDdXJzb3IoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnNvciA9IHJvb3QuZ2V0Q3Vyc29yKCk7XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBpZiAoIWxpc3QuaXNGb2xkZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZvbGRSb290ID0gbGlzdC5nZXRUb3BGb2xkUm9vdCgpO1xuICAgIGNvbnN0IGZpcnN0TGluZUVuZCA9IGZvbGRSb290LmdldExpbmVzSW5mbygpWzBdLnRvO1xuXG4gICAgaWYgKGN1cnNvci5saW5lID4gZmlyc3RMaW5lRW5kLmxpbmUpIHtcbiAgICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG4gICAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgICByb290LnJlcGxhY2VDdXJzb3IoZmlyc3RMaW5lRW5kKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290IH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIEtlZXBDdXJzb3JXaXRoaW5MaXN0Q29udGVudCBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogUm9vdCkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVDdXJzb3IoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnNvciA9IHJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgY29udGVudFN0YXJ0ID0gbGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnRBZnRlckNoZWNrYm94KCk7XG4gICAgY29uc3QgbGluZVByZWZpeCA9XG4gICAgICBjb250ZW50U3RhcnQubGluZSA9PT0gY3Vyc29yLmxpbmVcbiAgICAgICAgPyBjb250ZW50U3RhcnQuY2hcbiAgICAgICAgOiBsaXN0LmdldE5vdGVzSW5kZW50KCkubGVuZ3RoO1xuXG4gICAgaWYgKGN1cnNvci5jaCA8IGxpbmVQcmVmaXgpIHtcbiAgICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG4gICAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgICBsaW5lOiBjdXJzb3IubGluZSxcbiAgICAgICAgY2g6IGxpbmVQcmVmaXgsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFBsdWdpbl8yIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IEVkaXRvclN0YXRlLCBUcmFuc2FjdGlvbiB9IGZyb20gXCJAY29kZW1pcnJvci9zdGF0ZVwiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciwgZ2V0RWRpdG9yRnJvbVN0YXRlIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgS2VlcEN1cnNvck91dHNpZGVGb2xkZWRMaW5lcyB9IGZyb20gXCIuLi9vcGVyYXRpb25zL0tlZXBDdXJzb3JPdXRzaWRlRm9sZGVkTGluZXNcIjtcbmltcG9ydCB7IEtlZXBDdXJzb3JXaXRoaW5MaXN0Q29udGVudCB9IGZyb20gXCIuLi9vcGVyYXRpb25zL0tlZXBDdXJzb3JXaXRoaW5MaXN0Q29udGVudFwiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lclwiO1xuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1BhcnNlclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcblxuZXhwb3J0IGNsYXNzIEVkaXRvclNlbGVjdGlvbnNCZWhhdmlvdXJPdmVycmlkZSBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luXzIsXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAgRWRpdG9yU3RhdGUudHJhbnNhY3Rpb25FeHRlbmRlci5vZih0aGlzLnRyYW5zYWN0aW9uRXh0ZW5kZXIpXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHt9XG5cbiAgcHJpdmF0ZSB0cmFuc2FjdGlvbkV4dGVuZGVyID0gKHRyOiBUcmFuc2FjdGlvbik6IG51bGwgPT4ge1xuICAgIGlmICh0aGlzLnNldHRpbmdzLmtlZXBDdXJzb3JXaXRoaW5Db250ZW50ID09PSBcIm5ldmVyXCIgfHwgIXRyLnNlbGVjdGlvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZWRpdG9yID0gZ2V0RWRpdG9yRnJvbVN0YXRlKHRyLnN0YXJ0U3RhdGUpO1xuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmhhbmRsZVNlbGVjdGlvbnNDaGFuZ2VzKGVkaXRvcik7XG4gICAgfSwgMCk7XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICBwcml2YXRlIGhhbmRsZVNlbGVjdGlvbnNDaGFuZ2VzID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICBjb25zdCByb290ID0gdGhpcy5wYXJzZXIucGFyc2UoZWRpdG9yKTtcblxuICAgIGlmICghcm9vdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHtcbiAgICAgIGNvbnN0IHsgc2hvdWxkU3RvcFByb3BhZ2F0aW9uIH0gPSB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5ldmFsKFxuICAgICAgICByb290LFxuICAgICAgICBuZXcgS2VlcEN1cnNvck91dHNpZGVGb2xkZWRMaW5lcyhyb290KSxcbiAgICAgICAgZWRpdG9yXG4gICAgICApO1xuXG4gICAgICBpZiAoc2hvdWxkU3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5ldmFsKFxuICAgICAgcm9vdCxcbiAgICAgIG5ldyBLZWVwQ3Vyc29yV2l0aGluTGlzdENvbnRlbnQocm9vdCksXG4gICAgICBlZGl0b3JcbiAgICApO1xuICB9O1xufVxuIiwiZXhwb3J0IGNvbnN0IGNoZWNrYm94UmUgPSBgXFxcXFtbXlxcXFxbXFxcXF1dXFxcXF1bIFxcdF1gO1xuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94KGxpbmU6IHN0cmluZykge1xuICByZXR1cm4gbGluZSA9PT0gXCJcIiB8fCBsaW5lID09PSBcIlsgXSBcIjtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBMaXN0LCBQb3NpdGlvbiwgUm9vdCwgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyB9IGZyb20gXCIuLi9yb290XCI7XG5pbXBvcnQgeyBjaGVja2JveFJlIH0gZnJvbSBcIi4uL3V0aWxzL2NoZWNrYm94UmVcIjtcbmltcG9ydCB7IGlzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94IH0gZnJvbSBcIi4uL3V0aWxzL2lzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2V0Wm9vbVJhbmdlIHtcbiAgZ2V0Wm9vbVJhbmdlKCk6IHsgZnJvbTogUG9zaXRpb247IHRvOiBQb3NpdGlvbiB9IHwgbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIENyZWF0ZU5ld0l0ZW0gaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJvb3Q6IFJvb3QsXG4gICAgcHJpdmF0ZSBkZWZhdWx0SW5kZW50Q2hhcnM6IHN0cmluZyxcbiAgICBwcml2YXRlIGdldFpvb21SYW5nZTogR2V0Wm9vbVJhbmdlXG4gICkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVTZWxlY3Rpb24oKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdGlvbiA9IHJvb3QuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKCFzZWxlY3Rpb24gfHwgc2VsZWN0aW9uLmFuY2hvci5saW5lICE9PSBzZWxlY3Rpb24uaGVhZC5saW5lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgbGluZXMgPSBsaXN0LmdldExpbmVzSW5mbygpO1xuXG4gICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSAmJiBpc0VtcHR5TGluZU9yRW1wdHlDaGVja2JveChsaW5lc1swXS50ZXh0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnNvciA9IHJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgbGluZVVuZGVyQ3Vyc29yID0gbGluZXMuZmluZCgobCkgPT4gbC5mcm9tLmxpbmUgPT09IGN1cnNvci5saW5lKTtcblxuICAgIGlmIChjdXJzb3IuY2ggPCBsaW5lVW5kZXJDdXJzb3IuZnJvbS5jaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHsgb2xkTGluZXMsIG5ld0xpbmVzIH0gPSBsaW5lcy5yZWR1Y2UoXG4gICAgICAoYWNjLCBsaW5lKSA9PiB7XG4gICAgICAgIGlmIChjdXJzb3IubGluZSA+IGxpbmUuZnJvbS5saW5lKSB7XG4gICAgICAgICAgYWNjLm9sZExpbmVzLnB1c2gobGluZS50ZXh0KTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJzb3IubGluZSA9PT0gbGluZS5mcm9tLmxpbmUpIHtcbiAgICAgICAgICBjb25zdCBsZWZ0ID0gbGluZS50ZXh0LnNsaWNlKDAsIHNlbGVjdGlvbi5mcm9tIC0gbGluZS5mcm9tLmNoKTtcbiAgICAgICAgICBjb25zdCByaWdodCA9IGxpbmUudGV4dC5zbGljZShzZWxlY3Rpb24udG8gLSBsaW5lLmZyb20uY2gpO1xuICAgICAgICAgIGFjYy5vbGRMaW5lcy5wdXNoKGxlZnQpO1xuICAgICAgICAgIGFjYy5uZXdMaW5lcy5wdXNoKHJpZ2h0KTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJzb3IubGluZSA8IGxpbmUuZnJvbS5saW5lKSB7XG4gICAgICAgICAgYWNjLm5ld0xpbmVzLnB1c2gobGluZS50ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBvbGRMaW5lczogW10sXG4gICAgICAgIG5ld0xpbmVzOiBbXSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgY29kZUJsb2NrQmFjdGlja3MgPSBvbGRMaW5lcy5qb2luKFwiXFxuXCIpLnNwbGl0KFwiYGBgXCIpLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgaXNJbnNpZGVDb2RlYmxvY2sgPVxuICAgICAgY29kZUJsb2NrQmFjdGlja3MgPiAwICYmIGNvZGVCbG9ja0JhY3RpY2tzICUgMiAhPT0gMDtcblxuICAgIGlmIChpc0luc2lkZUNvZGVibG9jaykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3Qgem9vbVJhbmdlID0gdGhpcy5nZXRab29tUmFuZ2UuZ2V0Wm9vbVJhbmdlKCk7XG4gICAgY29uc3QgbGlzdElzWm9vbWluZ1Jvb3QgPSBCb29sZWFuKFxuICAgICAgem9vbVJhbmdlICYmXG4gICAgICAgIGxpc3QuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSA+PSB6b29tUmFuZ2UuZnJvbS5saW5lICYmXG4gICAgICAgIGxpc3QuZ2V0TGFzdExpbmVDb250ZW50RW5kKCkubGluZSA8PSB6b29tUmFuZ2UuZnJvbS5saW5lXG4gICAgKTtcblxuICAgIGNvbnN0IGhhc0NoaWxkcmVuID0gIWxpc3QuaXNFbXB0eSgpO1xuICAgIGNvbnN0IGNoaWxkSXNGb2xkZWQgPSBsaXN0LmlzRm9sZFJvb3QoKTtcbiAgICBjb25zdCBlbmRQb3MgPSBsaXN0LmdldExhc3RMaW5lQ29udGVudEVuZCgpO1xuICAgIGNvbnN0IGVuZE9mTGluZSA9IGN1cnNvci5saW5lID09PSBlbmRQb3MubGluZSAmJiBjdXJzb3IuY2ggPT09IGVuZFBvcy5jaDtcblxuICAgIGNvbnN0IG9uQ2hpbGRMZXZlbCA9XG4gICAgICBsaXN0SXNab29taW5nUm9vdCB8fCAoaGFzQ2hpbGRyZW4gJiYgIWNoaWxkSXNGb2xkZWQgJiYgZW5kT2ZMaW5lKTtcblxuICAgIGNvbnN0IGluZGVudCA9IG9uQ2hpbGRMZXZlbFxuICAgICAgPyBoYXNDaGlsZHJlblxuICAgICAgICA/IGxpc3QuZ2V0Q2hpbGRyZW4oKVswXS5nZXRGaXJzdExpbmVJbmRlbnQoKVxuICAgICAgICA6IGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkgKyB0aGlzLmRlZmF1bHRJbmRlbnRDaGFyc1xuICAgICAgOiBsaXN0LmdldEZpcnN0TGluZUluZGVudCgpO1xuXG4gICAgY29uc3QgYnVsbGV0ID1cbiAgICAgIG9uQ2hpbGRMZXZlbCAmJiBoYXNDaGlsZHJlblxuICAgICAgICA/IGxpc3QuZ2V0Q2hpbGRyZW4oKVswXS5nZXRCdWxsZXQoKVxuICAgICAgICA6IGxpc3QuZ2V0QnVsbGV0KCk7XG5cbiAgICBjb25zdCBzcGFjZUFmdGVyQnVsbGV0ID1cbiAgICAgIG9uQ2hpbGRMZXZlbCAmJiBoYXNDaGlsZHJlblxuICAgICAgICA/IGxpc3QuZ2V0Q2hpbGRyZW4oKVswXS5nZXRTcGFjZUFmdGVyQnVsbGV0KClcbiAgICAgICAgOiBsaXN0LmdldFNwYWNlQWZ0ZXJCdWxsZXQoKTtcblxuICAgIGNvbnN0IHByZWZpeCA9IG9sZExpbmVzWzBdLm1hdGNoKGNoZWNrYm94UmUpID8gXCJbIF0gXCIgOiBcIlwiO1xuXG4gICAgY29uc3QgbmV3TGlzdCA9IG5ldyBMaXN0KFxuICAgICAgbGlzdC5nZXRSb290KCksXG4gICAgICBpbmRlbnQsXG4gICAgICBidWxsZXQsXG4gICAgICBwcmVmaXgsXG4gICAgICBzcGFjZUFmdGVyQnVsbGV0LFxuICAgICAgcHJlZml4ICsgbmV3TGluZXMuc2hpZnQoKSxcbiAgICAgIGZhbHNlXG4gICAgKTtcblxuICAgIGlmIChuZXdMaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICBuZXdMaXN0LnNldE5vdGVzSW5kZW50KGxpc3QuZ2V0Tm90ZXNJbmRlbnQoKSk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbmV3TGluZXMpIHtcbiAgICAgICAgbmV3TGlzdC5hZGRMaW5lKGxpbmUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvbkNoaWxkTGV2ZWwpIHtcbiAgICAgIGxpc3QuYWRkQmVmb3JlQWxsKG5ld0xpc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWNoaWxkSXNGb2xkZWQgfHwgIWVuZE9mTGluZSkge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGxpc3QuZ2V0Q2hpbGRyZW4oKTtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgIGxpc3QucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgIG5ld0xpc3QuYWRkQWZ0ZXJBbGwoY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxpc3QuZ2V0UGFyZW50KCkuYWRkQWZ0ZXIobGlzdCwgbmV3TGlzdCk7XG4gICAgfVxuXG4gICAgbGlzdC5yZXBsYWNlTGluZXMob2xkTGluZXMpO1xuXG4gICAgY29uc3QgbmV3TGlzdFN0YXJ0ID0gbmV3TGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgbGluZTogbmV3TGlzdFN0YXJ0LmxpbmUsXG4gICAgICBjaDogbmV3TGlzdFN0YXJ0LmNoICsgcHJlZml4Lmxlbmd0aCxcbiAgICB9KTtcblxuICAgIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMocm9vdCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290LCByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzIH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIE91dGRlbnRMaXN0IGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBSb290KSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZUN1cnNvcigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSB0cnVlO1xuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgcGFyZW50ID0gbGlzdC5nZXRQYXJlbnQoKTtcbiAgICBjb25zdCBncmFuZFBhcmVudCA9IHBhcmVudC5nZXRQYXJlbnQoKTtcblxuICAgIGlmICghZ3JhbmRQYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUJlZm9yZSA9IHJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZihsaXN0KVswXTtcbiAgICBjb25zdCBpbmRlbnRSbUZyb20gPSBwYXJlbnQuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoO1xuICAgIGNvbnN0IGluZGVudFJtVGlsbCA9IGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoO1xuXG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKGxpc3QpO1xuICAgIGdyYW5kUGFyZW50LmFkZEFmdGVyKHBhcmVudCwgbGlzdCk7XG4gICAgbGlzdC51bmluZGVudENvbnRlbnQoaW5kZW50Um1Gcm9tLCBpbmRlbnRSbVRpbGwpO1xuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUFmdGVyID0gcm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3QpWzBdO1xuICAgIGNvbnN0IGxpbmVEaWZmID0gbGlzdFN0YXJ0TGluZUFmdGVyIC0gbGlzdFN0YXJ0TGluZUJlZm9yZTtcbiAgICBjb25zdCBjaERpZmYgPSBpbmRlbnRSbVRpbGwgLSBpbmRlbnRSbUZyb207XG5cbiAgICBjb25zdCBjdXJzb3IgPSByb290LmdldEN1cnNvcigpO1xuICAgIHJvb3QucmVwbGFjZUN1cnNvcih7XG4gICAgICBsaW5lOiBjdXJzb3IubGluZSArIGxpbmVEaWZmLFxuICAgICAgY2g6IGN1cnNvci5jaCAtIGNoRGlmZixcbiAgICB9KTtcblxuICAgIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMocm9vdCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuaW1wb3J0IHsgT3V0ZGVudExpc3QgfSBmcm9tIFwiLi9PdXRkZW50TGlzdFwiO1xuXG5pbXBvcnQgeyBSb290IH0gZnJvbSBcIi4uL3Jvb3RcIjtcbmltcG9ydCB7IGlzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94IH0gZnJvbSBcIi4uL3V0aWxzL2lzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94XCI7XG5cbmV4cG9ydCBjbGFzcyBPdXRkZW50TGlzdElmSXRzRW1wdHkgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIG91dGRlbnRMaXN0OiBPdXRkZW50TGlzdDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHtcbiAgICB0aGlzLm91dGRlbnRMaXN0ID0gbmV3IE91dGRlbnRMaXN0KHJvb3QpO1xuICB9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm91dGRlbnRMaXN0LnNob3VsZFN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLm91dGRlbnRMaXN0LnNob3VsZFVwZGF0ZSgpO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXMoKTtcblxuICAgIGlmIChcbiAgICAgIGxpbmVzLmxlbmd0aCA+IDEgfHxcbiAgICAgICFpc0VtcHR5TGluZU9yRW1wdHlDaGVja2JveChsaW5lc1swXSkgfHxcbiAgICAgIGxpc3QuZ2V0TGV2ZWwoKSA9PT0gMVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMub3V0ZGVudExpc3QucGVyZm9ybSgpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBQcmVjIH0gZnJvbSBcIkBjb2RlbWlycm9yL3N0YXRlXCI7XG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IENyZWF0ZU5ld0l0ZW0gfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9DcmVhdGVOZXdJdGVtXCI7XG5pbXBvcnQgeyBPdXRkZW50TGlzdElmSXRzRW1wdHkgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9PdXRkZW50TGlzdElmSXRzRW1wdHlcIjtcbmltcG9ydCB7IElNRURldGVjdG9yIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBPYnNpZGlhblNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09ic2lkaWFuU2V0dGluZ3NcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9QYXJzZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgRW50ZXJCZWhhdmlvdXJPdmVycmlkZSBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luXzIsXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBpbWVEZXRlY3RvcjogSU1FRGV0ZWN0b3IsXG4gICAgcHJpdmF0ZSBvYnNpZGlhblNldHRpbmdzOiBPYnNpZGlhblNldHRpbmdzLFxuICAgIHByaXZhdGUgcGFyc2VyOiBQYXJzZXIsXG4gICAgcHJpdmF0ZSBvcGVyYXRpb25QZXJmb3JtZXI6IE9wZXJhdGlvblBlcmZvcm1lclxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIFByZWMuaGlnaGVzdChcbiAgICAgICAga2V5bWFwLm9mKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXk6IFwiRW50ZXJcIixcbiAgICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHt9XG5cbiAgcHJpdmF0ZSBjaGVjayA9ICgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5vdmVycmlkZUVudGVyQmVoYXZpb3VyICYmICF0aGlzLmltZURldGVjdG9yLmlzT3BlbmVkKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLnBhcnNlci5wYXJzZShlZGl0b3IpO1xuXG4gICAgaWYgKCFyb290KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzaG91bGRVcGRhdGU6IGZhbHNlLFxuICAgICAgICBzaG91bGRTdG9wUHJvcGFnYXRpb246IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB7XG4gICAgICBjb25zdCByZXMgPSB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5ldmFsKFxuICAgICAgICByb290LFxuICAgICAgICBuZXcgT3V0ZGVudExpc3RJZkl0c0VtcHR5KHJvb3QpLFxuICAgICAgICBlZGl0b3JcbiAgICAgICk7XG5cbiAgICAgIGlmIChyZXMuc2hvdWxkU3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAge1xuICAgICAgY29uc3QgZGVmYXVsdEluZGVudENoYXJzID0gdGhpcy5vYnNpZGlhblNldHRpbmdzLmdldERlZmF1bHRJbmRlbnRDaGFycygpO1xuICAgICAgY29uc3Qgem9vbVJhbmdlID0gZWRpdG9yLmdldFpvb21SYW5nZSgpO1xuICAgICAgY29uc3QgZ2V0Wm9vbVJhbmdlID0ge1xuICAgICAgICBnZXRab29tUmFuZ2U6ICgpID0+IHpvb21SYW5nZSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlcyA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLmV2YWwoXG4gICAgICAgIHJvb3QsXG4gICAgICAgIG5ldyBDcmVhdGVOZXdJdGVtKHJvb3QsIGRlZmF1bHRJbmRlbnRDaGFycywgZ2V0Wm9vbVJhbmdlKSxcbiAgICAgICAgZWRpdG9yXG4gICAgICApO1xuXG4gICAgICBpZiAocmVzLnNob3VsZFVwZGF0ZSAmJiB6b29tUmFuZ2UpIHtcbiAgICAgICAgZWRpdG9yLnRyeVJlZnJlc2hab29tKHpvb21SYW5nZS5mcm9tLmxpbmUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IEVkaXRvciB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVkaXRvckNhbGxiYWNrKGNiOiAoZWRpdG9yOiBNeUVkaXRvcikgPT4gYm9vbGVhbikge1xuICByZXR1cm4gKGVkaXRvcjogRWRpdG9yKSA9PiB7XG4gICAgY29uc3QgbXlFZGl0b3IgPSBuZXcgTXlFZGl0b3IoZWRpdG9yKTtcbiAgICBjb25zdCBzaG91bGRTdG9wUHJvcGFnYXRpb24gPSBjYihteUVkaXRvcik7XG5cbiAgICBpZiAoXG4gICAgICAhc2hvdWxkU3RvcFByb3BhZ2F0aW9uICYmXG4gICAgICB3aW5kb3cuZXZlbnQgJiZcbiAgICAgIHdpbmRvdy5ldmVudC50eXBlID09PSBcImtleWRvd25cIlxuICAgICkge1xuICAgICAgbXlFZGl0b3IudHJpZ2dlck9uS2V5RG93bih3aW5kb3cuZXZlbnQgYXMgS2V5Ym9hcmRFdmVudCk7XG4gICAgfVxuICB9O1xufVxuIiwiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IE9ic2lkaWFuU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvT2JzaWRpYW5TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlRWRpdG9yQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlRWRpdG9yQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIExpc3RzRm9sZGluZ0NvbW1hbmRzIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW5fMixcbiAgICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3NcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJmb2xkXCIsXG4gICAgICBpY29uOiBcImNoZXZyb25zLWRvd24tdXBcIixcbiAgICAgIG5hbWU6IFwiRm9sZCB0aGUgbGlzdFwiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGNyZWF0ZUVkaXRvckNhbGxiYWNrKHRoaXMuZm9sZCksXG4gICAgICBob3RrZXlzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBtb2RpZmllcnM6IFtcIk1vZFwiXSxcbiAgICAgICAgICBrZXk6IFwiQXJyb3dVcFwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwidW5mb2xkXCIsXG4gICAgICBpY29uOiBcImNoZXZyb25zLXVwLWRvd25cIixcbiAgICAgIG5hbWU6IFwiVW5mb2xkIHRoZSBsaXN0XCIsXG4gICAgICBlZGl0b3JDYWxsYmFjazogY3JlYXRlRWRpdG9yQ2FsbGJhY2sodGhpcy51bmZvbGQpLFxuICAgICAgaG90a2V5czogW1xuICAgICAgICB7XG4gICAgICAgICAgbW9kaWZpZXJzOiBbXCJNb2RcIl0sXG4gICAgICAgICAga2V5OiBcIkFycm93RG93blwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHt9XG5cbiAgcHJpdmF0ZSBzZXRGb2xkKGVkaXRvcjogTXlFZGl0b3IsIHR5cGU6IFwiZm9sZFwiIHwgXCJ1bmZvbGRcIikge1xuICAgIGlmICghdGhpcy5vYnNpZGlhblNldHRpbmdzLmdldEZvbGRTZXR0aW5ncygpLmZvbGRJbmRlbnQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXG4gICAgICAgIGBVbmFibGUgdG8gJHt0eXBlfSBiZWNhdXNlIGZvbGRpbmcgaXMgZGlzYWJsZWQuIFBsZWFzZSBlbmFibGUgXCJGb2xkIGluZGVudFwiIGluIE9ic2lkaWFuIHNldHRpbmdzLmAsXG4gICAgICAgIDUwMDBcbiAgICAgICk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XG5cbiAgICBpZiAodHlwZSA9PT0gXCJmb2xkXCIpIHtcbiAgICAgIGVkaXRvci5mb2xkKGN1cnNvci5saW5lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdG9yLnVuZm9sZChjdXJzb3IubGluZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGZvbGQgPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLnNldEZvbGQoZWRpdG9yLCBcImZvbGRcIik7XG4gIH07XG5cbiAgcHJpdmF0ZSB1bmZvbGQgPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLnNldEZvbGQoZWRpdG9yLCBcInVuZm9sZFwiKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290LCByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzIH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIEluZGVudExpc3QgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QsIHByaXZhdGUgZGVmYXVsdEluZGVudENoYXJzOiBzdHJpbmcpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBwYXJlbnQgPSBsaXN0LmdldFBhcmVudCgpO1xuICAgIGNvbnN0IHByZXYgPSBwYXJlbnQuZ2V0UHJldlNpYmxpbmdPZihsaXN0KTtcblxuICAgIGlmICghcHJldikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG5cbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lQmVmb3JlID0gcm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3QpWzBdO1xuXG4gICAgY29uc3QgaW5kZW50UG9zID0gbGlzdC5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGg7XG4gICAgbGV0IGluZGVudENoYXJzID0gXCJcIjtcblxuICAgIGlmIChpbmRlbnRDaGFycyA9PT0gXCJcIiAmJiAhcHJldi5pc0VtcHR5KCkpIHtcbiAgICAgIGluZGVudENoYXJzID0gcHJldlxuICAgICAgICAuZ2V0Q2hpbGRyZW4oKVswXVxuICAgICAgICAuZ2V0Rmlyc3RMaW5lSW5kZW50KClcbiAgICAgICAgLnNsaWNlKHByZXYuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5kZW50Q2hhcnMgPT09IFwiXCIpIHtcbiAgICAgIGluZGVudENoYXJzID0gbGlzdFxuICAgICAgICAuZ2V0Rmlyc3RMaW5lSW5kZW50KClcbiAgICAgICAgLnNsaWNlKHBhcmVudC5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChpbmRlbnRDaGFycyA9PT0gXCJcIiAmJiAhbGlzdC5pc0VtcHR5KCkpIHtcbiAgICAgIGluZGVudENoYXJzID0gbGlzdC5nZXRDaGlsZHJlbigpWzBdLmdldEZpcnN0TGluZUluZGVudCgpO1xuICAgIH1cblxuICAgIGlmIChpbmRlbnRDaGFycyA9PT0gXCJcIikge1xuICAgICAgaW5kZW50Q2hhcnMgPSB0aGlzLmRlZmF1bHRJbmRlbnRDaGFycztcbiAgICB9XG5cbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobGlzdCk7XG4gICAgcHJldi5hZGRBZnRlckFsbChsaXN0KTtcbiAgICBsaXN0LmluZGVudENvbnRlbnQoaW5kZW50UG9zLCBpbmRlbnRDaGFycyk7XG5cbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lQWZ0ZXIgPSByb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YobGlzdClbMF07XG4gICAgY29uc3QgbGluZURpZmYgPSBsaXN0U3RhcnRMaW5lQWZ0ZXIgLSBsaXN0U3RhcnRMaW5lQmVmb3JlO1xuXG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgbGluZTogY3Vyc29yLmxpbmUgKyBsaW5lRGlmZixcbiAgICAgIGNoOiBjdXJzb3IuY2ggKyBpbmRlbnRDaGFycy5sZW5ndGgsXG4gICAgfSk7XG5cbiAgICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzKHJvb3QpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCwgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBNb3ZlTGlzdERvd24gaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBwYXJlbnQgPSBsaXN0LmdldFBhcmVudCgpO1xuICAgIGNvbnN0IGdyYW5kUGFyZW50ID0gcGFyZW50LmdldFBhcmVudCgpO1xuICAgIGNvbnN0IG5leHQgPSBwYXJlbnQuZ2V0TmV4dFNpYmxpbmdPZihsaXN0KTtcblxuICAgIGNvbnN0IGxpc3RTdGFydExpbmVCZWZvcmUgPSByb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YobGlzdClbMF07XG5cbiAgICBpZiAoIW5leHQgJiYgZ3JhbmRQYXJlbnQpIHtcbiAgICAgIGNvbnN0IG5ld1BhcmVudCA9IGdyYW5kUGFyZW50LmdldE5leHRTaWJsaW5nT2YocGFyZW50KTtcblxuICAgICAgaWYgKG5ld1BhcmVudCkge1xuICAgICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobGlzdCk7XG4gICAgICAgIG5ld1BhcmVudC5hZGRCZWZvcmVBbGwobGlzdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuZXh0KSB7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGxpc3QpO1xuICAgICAgcGFyZW50LmFkZEFmdGVyKG5leHQsIGxpc3QpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy51cGRhdGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUFmdGVyID0gcm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3QpWzBdO1xuICAgIGNvbnN0IGxpbmVEaWZmID0gbGlzdFN0YXJ0TGluZUFmdGVyIC0gbGlzdFN0YXJ0TGluZUJlZm9yZTtcblxuICAgIGNvbnN0IGN1cnNvciA9IHJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKHtcbiAgICAgIGxpbmU6IGN1cnNvci5saW5lICsgbGluZURpZmYsXG4gICAgICBjaDogY3Vyc29yLmNoLFxuICAgIH0pO1xuXG4gICAgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyhyb290KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgT3BlcmF0aW9uIH0gZnJvbSBcIi4vT3BlcmF0aW9uXCI7XG5cbmltcG9ydCB7IFJvb3QsIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgTW92ZUxpc3RVcCBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogUm9vdCkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVDdXJzb3IoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcblxuICAgIGNvbnN0IGxpc3QgPSByb290LmdldExpc3RVbmRlckN1cnNvcigpO1xuICAgIGNvbnN0IHBhcmVudCA9IGxpc3QuZ2V0UGFyZW50KCk7XG4gICAgY29uc3QgZ3JhbmRQYXJlbnQgPSBwYXJlbnQuZ2V0UGFyZW50KCk7XG4gICAgY29uc3QgcHJldiA9IHBhcmVudC5nZXRQcmV2U2libGluZ09mKGxpc3QpO1xuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUJlZm9yZSA9IHJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZihsaXN0KVswXTtcblxuICAgIGlmICghcHJldiAmJiBncmFuZFBhcmVudCkge1xuICAgICAgY29uc3QgbmV3UGFyZW50ID0gZ3JhbmRQYXJlbnQuZ2V0UHJldlNpYmxpbmdPZihwYXJlbnQpO1xuXG4gICAgICBpZiAobmV3UGFyZW50KSB7XG4gICAgICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChsaXN0KTtcbiAgICAgICAgbmV3UGFyZW50LmFkZEFmdGVyQWxsKGxpc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJldikge1xuICAgICAgdGhpcy51cGRhdGVkID0gdHJ1ZTtcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChsaXN0KTtcbiAgICAgIHBhcmVudC5hZGRCZWZvcmUocHJldiwgbGlzdCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnVwZGF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lQWZ0ZXIgPSByb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YobGlzdClbMF07XG4gICAgY29uc3QgbGluZURpZmYgPSBsaXN0U3RhcnRMaW5lQWZ0ZXIgLSBsaXN0U3RhcnRMaW5lQmVmb3JlO1xuXG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgbGluZTogY3Vyc29yLmxpbmUgKyBsaW5lRGlmZixcbiAgICAgIGNoOiBjdXJzb3IuY2gsXG4gICAgfSk7XG5cbiAgICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzKHJvb3QpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IEluZGVudExpc3QgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9JbmRlbnRMaXN0XCI7XG5pbXBvcnQgeyBNb3ZlTGlzdERvd24gfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9Nb3ZlTGlzdERvd25cIjtcbmltcG9ydCB7IE1vdmVMaXN0VXAgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9Nb3ZlTGlzdFVwXCI7XG5pbXBvcnQgeyBPdXRkZW50TGlzdCB9IGZyb20gXCIuLi9vcGVyYXRpb25zL091dGRlbnRMaXN0XCI7XG5pbXBvcnQgeyBPYnNpZGlhblNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09ic2lkaWFuU2V0dGluZ3NcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IGNyZWF0ZUVkaXRvckNhbGxiYWNrIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUVkaXRvckNhbGxiYWNrXCI7XG5cbmV4cG9ydCBjbGFzcyBMaXN0c01vdmVtZW50Q29tbWFuZHMgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgb2JzaWRpYW5TZXR0aW5nczogT2JzaWRpYW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibW92ZS1saXN0LWl0ZW0tdXBcIixcbiAgICAgIGljb246IFwiYXJyb3ctdXBcIixcbiAgICAgIG5hbWU6IFwiTW92ZSBsaXN0IGFuZCBzdWJsaXN0cyB1cFwiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGNyZWF0ZUVkaXRvckNhbGxiYWNrKHRoaXMubW92ZUxpc3RVcCksXG4gICAgICBob3RrZXlzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLFxuICAgICAgICAgIGtleTogXCJBcnJvd1VwXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJtb3ZlLWxpc3QtaXRlbS1kb3duXCIsXG4gICAgICBpY29uOiBcImFycm93LWRvd25cIixcbiAgICAgIG5hbWU6IFwiTW92ZSBsaXN0IGFuZCBzdWJsaXN0cyBkb3duXCIsXG4gICAgICBlZGl0b3JDYWxsYmFjazogY3JlYXRlRWRpdG9yQ2FsbGJhY2sodGhpcy5tb3ZlTGlzdERvd24pLFxuICAgICAgaG90a2V5czogW1xuICAgICAgICB7XG4gICAgICAgICAgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSxcbiAgICAgICAgICBrZXk6IFwiQXJyb3dEb3duXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbmRlbnQtbGlzdFwiLFxuICAgICAgaWNvbjogXCJpbmRlbnRcIixcbiAgICAgIG5hbWU6IFwiSW5kZW50IHRoZSBsaXN0IGFuZCBzdWJsaXN0c1wiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGNyZWF0ZUVkaXRvckNhbGxiYWNrKHRoaXMuaW5kZW50TGlzdCksXG4gICAgICBob3RrZXlzOiBbXSxcbiAgICB9KTtcblxuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3V0ZGVudC1saXN0XCIsXG4gICAgICBpY29uOiBcIm91dGRlbnRcIixcbiAgICAgIG5hbWU6IFwiT3V0ZGVudCB0aGUgbGlzdCBhbmQgc3VibGlzdHNcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiBjcmVhdGVFZGl0b3JDYWxsYmFjayh0aGlzLm91dGRlbnRMaXN0KSxcbiAgICAgIGhvdGtleXM6IFtdLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIG1vdmVMaXN0RG93biA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgY29uc3QgeyBzaG91bGRTdG9wUHJvcGFnYXRpb24gfSA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT4gbmV3IE1vdmVMaXN0RG93bihyb290KSxcbiAgICAgIGVkaXRvclxuICAgICk7XG5cbiAgICByZXR1cm4gc2hvdWxkU3RvcFByb3BhZ2F0aW9uO1xuICB9O1xuXG4gIHByaXZhdGUgbW92ZUxpc3RVcCA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgY29uc3QgeyBzaG91bGRTdG9wUHJvcGFnYXRpb24gfSA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT4gbmV3IE1vdmVMaXN0VXAocm9vdCksXG4gICAgICBlZGl0b3JcbiAgICApO1xuXG4gICAgcmV0dXJuIHNob3VsZFN0b3BQcm9wYWdhdGlvbjtcbiAgfTtcblxuICBwcml2YXRlIGluZGVudExpc3QgPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIGNvbnN0IHsgc2hvdWxkU3RvcFByb3BhZ2F0aW9uIH0gPSB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+XG4gICAgICAgIG5ldyBJbmRlbnRMaXN0KHJvb3QsIHRoaXMub2JzaWRpYW5TZXR0aW5ncy5nZXREZWZhdWx0SW5kZW50Q2hhcnMoKSksXG4gICAgICBlZGl0b3JcbiAgICApO1xuXG4gICAgcmV0dXJuIHNob3VsZFN0b3BQcm9wYWdhdGlvbjtcbiAgfTtcblxuICBwcml2YXRlIG91dGRlbnRMaXN0ID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICBjb25zdCB7IHNob3VsZFN0b3BQcm9wYWdhdGlvbiB9ID0gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PiBuZXcgT3V0ZGVudExpc3Qocm9vdCksXG4gICAgICBlZGl0b3JcbiAgICApO1xuXG4gICAgcmV0dXJuIHNob3VsZFN0b3BQcm9wYWdhdGlvbjtcbiAgfTtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290IH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIERlbGV0ZVRpbGxDdXJyZW50TGluZUNvbnRlbnRTdGFydCBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogUm9vdCkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVDdXJzb3IoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXNJbmZvKCk7XG4gICAgY29uc3QgbGluZU5vID0gbGluZXMuZmluZEluZGV4KChsKSA9PiBsLmZyb20ubGluZSA9PT0gY3Vyc29yLmxpbmUpO1xuXG4gICAgbGluZXNbbGluZU5vXS50ZXh0ID0gbGluZXNbbGluZU5vXS50ZXh0LnNsaWNlKFxuICAgICAgY3Vyc29yLmNoIC0gbGluZXNbbGluZU5vXS5mcm9tLmNoXG4gICAgKTtcblxuICAgIGxpc3QucmVwbGFjZUxpbmVzKGxpbmVzLm1hcCgobCkgPT4gbC50ZXh0KSk7XG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKGxpbmVzW2xpbmVOb10uZnJvbSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFBsdWdpbl8yIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgRGVsZXRlVGlsbEN1cnJlbnRMaW5lQ29udGVudFN0YXJ0IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvRGVsZXRlVGlsbEN1cnJlbnRMaW5lQ29udGVudFN0YXJ0XCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9JTUVEZXRlY3RvclwiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcbmltcG9ydCB7IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrXCI7XG5cbmV4cG9ydCBjbGFzcyBNZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgaW1lRGV0ZWN0b3I6IElNRURldGVjdG9yLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXJcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oXG4gICAgICBrZXltYXAub2YoW1xuICAgICAgICB7XG4gICAgICAgICAgbWFjOiBcIm0tQmFja3NwYWNlXCIsXG4gICAgICAgICAgcnVuOiBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayh7XG4gICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgIHJ1bjogdGhpcy5ydW4sXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICBdKVxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgIT09IFwibmV2ZXJcIiAmJlxuICAgICAgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKVxuICAgICk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+IG5ldyBEZWxldGVUaWxsQ3VycmVudExpbmVDb250ZW50U3RhcnQocm9vdCksXG4gICAgICBlZGl0b3JcbiAgICApO1xuICB9O1xufVxuIiwiaW1wb3J0IHsgTWFya2Rvd25SZW5kZXJlciwgTW9kYWwsIFBsdWdpbl8yIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5cbmNsYXNzIFJlbGVhc2VOb3Rlc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luXzIsXG4gICAgcHJpdmF0ZSB0aXRsZTogc3RyaW5nLFxuICAgIHByaXZhdGUgY29udGVudDogc3RyaW5nLFxuICAgIHByaXZhdGUgY2I6ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIocGx1Z2luLmFwcCk7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQodGhpcy50aXRsZSk7XG5cbiAgICBNYXJrZG93blJlbmRlcmVyLnJlbmRlck1hcmtkb3duKFxuICAgICAgdGhpcy5jb250ZW50LFxuICAgICAgdGhpcy5jb250ZW50RWwsXG4gICAgICBcIlwiLFxuICAgICAgdGhpcy5wbHVnaW5cbiAgICApO1xuICB9XG5cbiAgb25DbG9zZSgpIHtcbiAgICB0aGlzLmNiKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29tcGFyZVJlbGVhc2VzKGE6IHN0cmluZywgYjogc3RyaW5nKSB7XG4gIGNvbnN0IFthTWFqb3IsIGFNaW5vciwgYVBhdGNoXSA9IGEuc3BsaXQoXCIuXCIsIDMpLm1hcChOdW1iZXIpO1xuICBjb25zdCBbYk1ham9yLCBiTWlub3IsIGJQYXRjaF0gPSBiLnNwbGl0KFwiLlwiLCAzKS5tYXAoTnVtYmVyKTtcblxuICBpZiAoYU1ham9yID09PSBiTWFqb3IpIHtcbiAgICBpZiAoYU1pbm9yID09PSBiTWlub3IpIHtcbiAgICAgIHJldHVybiBhUGF0Y2ggLSBiUGF0Y2g7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFNaW5vciAtIGJNaW5vcjtcbiAgfVxuXG4gIHJldHVybiBhTWFqb3IgLSBiTWFqb3I7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2hhbmdlbG9nKCkge1xuICBjb25zdCBtYXJrZG93biA9IENIQU5HRUxPR19NRDtcbiAgY29uc3QgcmVsZWFzZU5vdGVzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgbGV0IHZlcnNpb247XG4gIGxldCBjb250ZW50ID0gXCJcIjtcblxuICBmb3IgKGNvbnN0IGxpbmUgb2YgbWFya2Rvd24uc3BsaXQoXCJcXG5cIikpIHtcbiAgICBjb25zdCB2ZXJzaW9uSGVhZGVyTWF0Y2hlcyA9IC9eIytcXHMrKFxcZCtcXC5cXGQrXFwuXFxkKykkLy5leGVjKGxpbmUpO1xuICAgIGlmICh2ZXJzaW9uSGVhZGVyTWF0Y2hlcykge1xuICAgICAgaWYgKHZlcnNpb24gJiYgY29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZWxlYXNlTm90ZXMucHVzaChbdmVyc2lvbiwgY29udGVudF0pO1xuICAgICAgfVxuICAgICAgdmVyc2lvbiA9IHZlcnNpb25IZWFkZXJNYXRjaGVzWzFdO1xuICAgICAgY29udGVudCA9IGxpbmU7XG4gICAgICBjb250ZW50ICs9IFwiXFxuXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRlbnQgKz0gbGluZTtcbiAgICAgIGNvbnRlbnQgKz0gXCJcXG5cIjtcbiAgICB9XG4gIH1cblxuICBpZiAodmVyc2lvbiAmJiBjb250ZW50LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgcmVsZWFzZU5vdGVzLnB1c2goW3ZlcnNpb24sIGNvbnRlbnRdKTtcbiAgfVxuXG4gIHJldHVybiByZWxlYXNlTm90ZXM7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWxlYXNlTm90ZXNBbm5vdW5jZW1lbnQgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgcHJpdmF0ZSBtb2RhbDogUmVsZWFzZU5vdGVzTW9kYWwgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogUGx1Z2luXzIsIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJzaG93LXJlbGVhc2Utbm90ZXNcIixcbiAgICAgIG5hbWU6IFwiU2hvdyBSZWxlYXNlIE5vdGVzXCIsXG4gICAgICBjYWxsYmFjazogdGhpcy5zaG93TW9kYWwsXG4gICAgfSk7XG5cbiAgICB0aGlzLnNob3dNb2RhbCh0aGlzLnNldHRpbmdzLnByZXZpb3VzUmVsZWFzZSk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7XG4gICAgaWYgKCF0aGlzLm1vZGFsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbW9kYWwgPSB0aGlzLm1vZGFsO1xuICAgIHRoaXMubW9kYWwgPSBudWxsO1xuICAgIG1vZGFsLmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dNb2RhbCA9IChwcmV2aW91c1JlbGVhc2U6IHN0cmluZyB8IG51bGwgPSBudWxsKSA9PiB7XG4gICAgbGV0IHJlbGVhc2VOb3RlcyA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBbdmVyc2lvbiwgY29udGVudF0gb2YgcGFyc2VDaGFuZ2Vsb2coKSkge1xuICAgICAgaWYgKGNvbXBhcmVSZWxlYXNlcyh2ZXJzaW9uLCBwcmV2aW91c1JlbGVhc2UgfHwgXCIwLjAuMFwiKSA+IDApIHtcbiAgICAgICAgcmVsZWFzZU5vdGVzICs9IGNvbnRlbnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlbGVhc2VOb3Rlcy50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbW9kYWxUaXRsZSA9IGBXZWxjb21lIHRvIE9ic2lkaWFuIE91dGxpbmVyICR7UExVR0lOX1ZFUlNJT059YDtcblxuICAgIHRoaXMubW9kYWwgPSBuZXcgUmVsZWFzZU5vdGVzTW9kYWwoXG4gICAgICB0aGlzLnBsdWdpbixcbiAgICAgIG1vZGFsVGl0bGUsXG4gICAgICByZWxlYXNlTm90ZXMsXG4gICAgICB0aGlzLmhhbmRsZUNsb3NlXG4gICAgKTtcbiAgICB0aGlzLm1vZGFsLm9wZW4oKTtcbiAgfTtcblxuICBwcml2YXRlIGhhbmRsZUNsb3NlID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghdGhpcy5tb2RhbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0dGluZ3MucHJldmlvdXNSZWxlYXNlID0gUExVR0lOX1ZFUlNJT047XG4gICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gIH07XG59XG4iLCJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFBsdWdpbl8yLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7XG4gIEtlZXBDdXJzb3JXaXRoaW5Db250ZW50LFxuICBTZXR0aW5ncyxcbiAgVmVydGljYWxMaW5lc0FjdGlvbixcbn0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5cbmNsYXNzIE9ic2lkaWFuT3V0bGluZXJQbHVnaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFBsdWdpbl8yLCBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncykge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcblxuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3RpY2sgdGhlIGN1cnNvciB0byB0aGUgY29udGVudFwiKVxuICAgICAgLnNldERlc2MoXCJEb24ndCBsZXQgdGhlIGN1cnNvciBtb3ZlIHRvIHRoZSBidWxsZXQgcG9zaXRpb24uXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgbmV2ZXI6IFwiTmV2ZXJcIixcbiAgICAgICAgICAgIFwiYnVsbGV0LW9ubHlcIjogXCJTdGljayBjdXJzb3Igb3V0IG9mIGJ1bGxldHNcIixcbiAgICAgICAgICAgIFwiYnVsbGV0LWFuZC1jaGVja2JveFwiOiBcIlN0aWNrIGN1cnNvciBvdXQgb2YgYnVsbGV0cyBhbmQgY2hlY2tib3hlc1wiLFxuICAgICAgICAgIH0gYXMgeyBba2V5IGluIEtlZXBDdXJzb3JXaXRoaW5Db250ZW50XTogc3RyaW5nIH0pXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogS2VlcEN1cnNvcldpdGhpbkNvbnRlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3Muc2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5oYW5jZSB0aGUgVGFiIGtleVwiKVxuICAgICAgLnNldERlc2MoXCJNYWtlIFRhYiBhbmQgU2hpZnQtVGFiIGJlaGF2ZSB0aGUgc2FtZSBhcyBvdGhlciBvdXRsaW5lcnMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVUYWJCZWhhdmlvdXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5vdmVycmlkZVRhYkJlaGF2aW91ciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFbmhhbmNlIHRoZSBFbnRlciBrZXlcIilcbiAgICAgIC5zZXREZXNjKFwiTWFrZSB0aGUgRW50ZXIga2V5IGJlaGF2ZSB0aGUgc2FtZSBhcyBvdGhlciBvdXRsaW5lcnMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVFbnRlckJlaGF2aW91cilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLm92ZXJyaWRlRW50ZXJCZWhhdmlvdXIgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3Muc2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5oYW5jZSB0aGUgQ3RybCtBIG9yIENtZCtBIGJlaGF2aW9yXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJQcmVzcyB0aGUgaG90a2V5IG9uY2UgdG8gc2VsZWN0IHRoZSBjdXJyZW50IGxpc3QgaXRlbS4gUHJlc3MgdGhlIGhvdGtleSB0d2ljZSB0byBzZWxlY3QgdGhlIGVudGlyZSBsaXN0LlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVTZWxlY3RBbGxCZWhhdmlvdXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5vdmVycmlkZVNlbGVjdEFsbEJlaGF2aW91ciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbXByb3ZlIHRoZSBzdHlsZSBvZiB5b3VyIGxpc3RzXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJTdHlsZXMgYXJlIG9ubHkgY29tcGF0aWJsZSB3aXRoIGJ1aWx0LWluIE9ic2lkaWFuIHRoZW1lcyBhbmQgbWF5IG5vdCBiZSBjb21wYXRpYmxlIHdpdGggb3RoZXIgdGhlbWVzLlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuYmV0dGVyTGlzdHNTdHlsZXMpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5iZXR0ZXJMaXN0c1N0eWxlcyA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEcmF3IHZlcnRpY2FsIGluZGVudGF0aW9uIGxpbmVzXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MudmVydGljYWxMaW5lcykub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy52ZXJ0aWNhbExpbmVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiVmVydGljYWwgaW5kZW50YXRpb24gbGluZSBjbGljayBhY3Rpb25cIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9ucyh7XG4gICAgICAgICAgICBub25lOiBcIk5vbmVcIixcbiAgICAgICAgICAgIFwiem9vbS1pblwiOiBcIlpvb20gSW5cIixcbiAgICAgICAgICAgIFwidG9nZ2xlLWZvbGRpbmdcIjogXCJUb2dnbGUgRm9sZGluZ1wiLFxuICAgICAgICAgIH0gYXMgeyBba2V5IGluIFZlcnRpY2FsTGluZXNBY3Rpb25dOiBzdHJpbmcgfSlcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy52ZXJ0aWNhbExpbmVzQWN0aW9uKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IFZlcnRpY2FsTGluZXNBY3Rpb24pID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MudmVydGljYWxMaW5lc0FjdGlvbiA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEcmFnLWFuZC1Ecm9wIChFeHBlcmltZW50YWwpXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MuZHJhZ0FuZERyb3ApLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZHJhZ0FuZERyb3AgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzLnNhdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWJ1ZyBtb2RlXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJPcGVuIERldlRvb2xzIChDb21tYW5kK09wdGlvbitJIG9yIENvbnRyb2wrU2hpZnQrSSkgdG8gY29weSB0aGUgZGVidWcgbG9ncy5cIlxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmRlYnVnKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLmRlYnVnID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldHRpbmdzVGFiIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBQbHVnaW5fMiwgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MpIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5hZGRTZXR0aW5nVGFiKFxuICAgICAgbmV3IE9ic2lkaWFuT3V0bGluZXJQbHVnaW5TZXR0aW5nVGFiKFxuICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXG4gICAgICAgIHRoaXMucGx1Z2luLFxuICAgICAgICB0aGlzLnNldHRpbmdzXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHt9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW5fMiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBQcmVjIH0gZnJvbSBcIkBjb2RlbWlycm9yL3N0YXRlXCI7XG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IE91dGRlbnRMaXN0IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvT3V0ZGVudExpc3RcIjtcbmltcG9ydCB7IElNRURldGVjdG9yIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIFNoaWZ0VGFiQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgaW1lRGV0ZWN0b3I6IElNRURldGVjdG9yLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXJcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oXG4gICAgICBQcmVjLmhpZ2hlc3QoXG4gICAgICAgIGtleW1hcC5vZihbXG4gICAgICAgICAge1xuICAgICAgICAgICAga2V5OiBcInMtVGFiXCIsXG4gICAgICAgICAgICBydW46IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKHtcbiAgICAgICAgICAgICAgY2hlY2s6IHRoaXMuY2hlY2ssXG4gICAgICAgICAgICAgIHJ1bjogdGhpcy5ydW4sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9LFxuICAgICAgICBdKVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVUYWJCZWhhdmlvdXIgJiYgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKTtcbiAgfTtcblxuICBwcml2YXRlIHJ1biA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT4gbmV3IE91dGRlbnRMaXN0KHJvb3QpLFxuICAgICAgZWRpdG9yXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IFBsdWdpbl8yIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IFByZWMgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIjtcbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgSW5kZW50TGlzdCB9IGZyb20gXCIuLi9vcGVyYXRpb25zL0luZGVudExpc3RcIjtcbmltcG9ydCB7IElNRURldGVjdG9yIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBPYnNpZGlhblNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09ic2lkaWFuU2V0dGluZ3NcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgVGFiQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgaW1lRGV0ZWN0b3I6IElNRURldGVjdG9yLFxuICAgIHByaXZhdGUgb2JzaWRpYW5TZXR0aW5nczogT2JzaWRpYW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAgUHJlYy5oaWdoZXN0KFxuICAgICAgICBrZXltYXAub2YoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleTogXCJUYWJcIixcbiAgICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHt9XG5cbiAgcHJpdmF0ZSBjaGVjayA9ICgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5vdmVycmlkZVRhYkJlaGF2aW91ciAmJiAhdGhpcy5pbWVEZXRlY3Rvci5pc09wZW5lZCgpO1xuICB9O1xuXG4gIHByaXZhdGUgcnVuID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PlxuICAgICAgICBuZXcgSW5kZW50TGlzdChyb290LCB0aGlzLm9ic2lkaWFuU2V0dGluZ3MuZ2V0RGVmYXVsdEluZGVudENoYXJzKCkpLFxuICAgICAgZWRpdG9yXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IFBsdWdpbl8yIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7XG4gIEVkaXRvclZpZXcsXG4gIFBsdWdpblZhbHVlLFxuICBWaWV3UGx1Z2luLFxuICBWaWV3VXBkYXRlLFxufSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciwgZ2V0RWRpdG9yRnJvbVN0YXRlIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgTGlzdCB9IGZyb20gXCIuLi9yb290XCI7XG5pbXBvcnQgeyBPYnNpZGlhblNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09ic2lkaWFuU2V0dGluZ3NcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9QYXJzZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5cbmNvbnN0IFZFUlRJQ0FMX0xJTkVTX0JPRFlfQ0xBU1MgPSBcIm91dGxpbmVyLXBsdWdpbi12ZXJ0aWNhbC1saW5lc1wiO1xuXG5pbnRlcmZhY2UgTGluZURhdGEge1xuICB0b3A6IG51bWJlcjtcbiAgbGVmdDogbnVtYmVyO1xuICBoZWlnaHQ6IHN0cmluZztcbiAgbGlzdDogTGlzdDtcbn1cblxuY2xhc3MgVmVydGljYWxMaW5lc1BsdWdpblZhbHVlIGltcGxlbWVudHMgUGx1Z2luVmFsdWUge1xuICBwcml2YXRlIHNjaGVkdWxlZDogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD47XG4gIHByaXZhdGUgc2Nyb2xsZXI6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGNvbnRlbnRDb250YWluZXI6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGVkaXRvcjogTXlFZGl0b3I7XG4gIHByaXZhdGUgbGFzdExpbmU6IG51bWJlcjtcbiAgcHJpdmF0ZSBsaW5lczogTGluZURhdGFbXTtcbiAgcHJpdmF0ZSBsaW5lRWxlbWVudHM6IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcbiAgICBwcml2YXRlIHZpZXc6IEVkaXRvclZpZXdcbiAgKSB7XG4gICAgdGhpcy52aWV3LnNjcm9sbERPTS5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHRoaXMub25TY3JvbGwpO1xuICAgIHRoaXMuc2V0dGluZ3Mub25DaGFuZ2UodGhpcy5zY2hlZHVsZVJlY2FsY3VsYXRlKTtcblxuICAgIHRoaXMucHJlcGFyZURvbSgpO1xuICAgIHRoaXMud2FpdEZvckVkaXRvcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB3YWl0Rm9yRWRpdG9yID0gKCkgPT4ge1xuICAgIGNvbnN0IGVkaXRvciA9IGdldEVkaXRvckZyb21TdGF0ZSh0aGlzLnZpZXcuc3RhdGUpO1xuICAgIGlmICghZWRpdG9yKSB7XG4gICAgICBzZXRUaW1lb3V0KHRoaXMud2FpdEZvckVkaXRvciwgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgIHRoaXMuc2NoZWR1bGVSZWNhbGN1bGF0ZSgpO1xuICB9O1xuXG4gIHByaXZhdGUgcHJlcGFyZURvbSgpIHtcbiAgICB0aGlzLmNvbnRlbnRDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuY29udGVudENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFxuICAgICAgXCJvdXRsaW5lci1wbHVnaW4tbGlzdC1saW5lcy1jb250ZW50LWNvbnRhaW5lclwiXG4gICAgKTtcblxuICAgIHRoaXMuc2Nyb2xsZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuc2Nyb2xsZXIuY2xhc3NMaXN0LmFkZChcIm91dGxpbmVyLXBsdWdpbi1saXN0LWxpbmVzLXNjcm9sbGVyXCIpO1xuXG4gICAgdGhpcy5zY3JvbGxlci5hcHBlbmRDaGlsZCh0aGlzLmNvbnRlbnRDb250YWluZXIpO1xuICAgIHRoaXMudmlldy5kb20uYXBwZW5kQ2hpbGQodGhpcy5zY3JvbGxlcik7XG4gIH1cblxuICBwcml2YXRlIG9uU2Nyb2xsID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgY29uc3QgeyBzY3JvbGxMZWZ0LCBzY3JvbGxUb3AgfSA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIHRoaXMuc2Nyb2xsZXIuc2Nyb2xsVG8oc2Nyb2xsTGVmdCwgc2Nyb2xsVG9wKTtcbiAgfTtcblxuICBwcml2YXRlIHNjaGVkdWxlUmVjYWxjdWxhdGUgPSAoKSA9PiB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuc2NoZWR1bGVkKTtcbiAgICB0aGlzLnNjaGVkdWxlZCA9IHNldFRpbWVvdXQodGhpcy5jYWxjdWxhdGUsIDApO1xuICB9O1xuXG4gIHVwZGF0ZSh1cGRhdGU6IFZpZXdVcGRhdGUpIHtcbiAgICBpZiAoXG4gICAgICB1cGRhdGUuZG9jQ2hhbmdlZCB8fFxuICAgICAgdXBkYXRlLnZpZXdwb3J0Q2hhbmdlZCB8fFxuICAgICAgdXBkYXRlLmdlb21ldHJ5Q2hhbmdlZCB8fFxuICAgICAgdXBkYXRlLnRyYW5zYWN0aW9ucy5zb21lKCh0cikgPT4gdHIucmVjb25maWd1cmVkKVxuICAgICkge1xuICAgICAgdGhpcy5zY2hlZHVsZVJlY2FsY3VsYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGUgPSAoKSA9PiB7XG4gICAgdGhpcy5saW5lcyA9IFtdO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5zZXR0aW5ncy52ZXJ0aWNhbExpbmVzICYmXG4gICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MuaXNEZWZhdWx0VGhlbWVFbmFibGVkKCkgJiZcbiAgICAgIHRoaXMudmlldy52aWV3cG9ydExpbmVCbG9ja3MubGVuZ3RoID4gMCAmJlxuICAgICAgdGhpcy52aWV3LnZpc2libGVSYW5nZXMubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgY29uc3QgZnJvbUxpbmUgPSB0aGlzLmVkaXRvci5vZmZzZXRUb1Bvcyh0aGlzLnZpZXcudmlld3BvcnQuZnJvbSkubGluZTtcbiAgICAgIGNvbnN0IHRvTGluZSA9IHRoaXMuZWRpdG9yLm9mZnNldFRvUG9zKHRoaXMudmlldy52aWV3cG9ydC50bykubGluZTtcbiAgICAgIGNvbnN0IGxpc3RzID0gdGhpcy5wYXJzZXIucGFyc2VSYW5nZSh0aGlzLmVkaXRvciwgZnJvbUxpbmUsIHRvTGluZSk7XG5cbiAgICAgIGZvciAoY29uc3QgbGlzdCBvZiBsaXN0cykge1xuICAgICAgICB0aGlzLmxhc3RMaW5lID0gbGlzdC5nZXRDb250ZW50RW5kKCkubGluZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGMgb2YgbGlzdC5nZXRDaGlsZHJlbigpKSB7XG4gICAgICAgICAgdGhpcy5yZWN1cnNpdmUoYyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5saW5lcy5zb3J0KChhLCBiKSA9PlxuICAgICAgICBhLnRvcCA9PT0gYi50b3AgPyBhLmxlZnQgLSBiLmxlZnQgOiBhLnRvcCAtIGIudG9wXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlRG9tKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBnZXROZXh0U2libGluZyhsaXN0OiBMaXN0KTogTGlzdCB8IG51bGwge1xuICAgIGxldCBsaXN0VG1wID0gbGlzdDtcbiAgICBsZXQgcCA9IGxpc3RUbXAuZ2V0UGFyZW50KCk7XG4gICAgd2hpbGUgKHApIHtcbiAgICAgIGNvbnN0IG5leHRTaWJsaW5nID0gcC5nZXROZXh0U2libGluZ09mKGxpc3RUbXApO1xuICAgICAgaWYgKG5leHRTaWJsaW5nKSB7XG4gICAgICAgIHJldHVybiBuZXh0U2libGluZztcbiAgICAgIH1cbiAgICAgIGxpc3RUbXAgPSBwO1xuICAgICAgcCA9IGxpc3RUbXAuZ2V0UGFyZW50KCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSByZWN1cnNpdmUobGlzdDogTGlzdCwgcGFyZW50Q3R4OiB7IHJvb3RMZWZ0PzogbnVtYmVyIH0gPSB7fSkge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gbGlzdC5nZXRDaGlsZHJlbigpO1xuXG4gICAgaWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZyb21PZmZzZXQgPSB0aGlzLmVkaXRvci5wb3NUb09mZnNldCh7XG4gICAgICBsaW5lOiBsaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUsXG4gICAgICBjaDogbGlzdC5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGgsXG4gICAgfSk7XG4gICAgY29uc3QgbmV4dFNpYmxpbmcgPSB0aGlzLmdldE5leHRTaWJsaW5nKGxpc3QpO1xuICAgIGNvbnN0IHRpbGxPZmZzZXQgPSB0aGlzLmVkaXRvci5wb3NUb09mZnNldCh7XG4gICAgICBsaW5lOiBuZXh0U2libGluZ1xuICAgICAgICA/IG5leHRTaWJsaW5nLmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUgLSAxXG4gICAgICAgIDogdGhpcy5sYXN0TGluZSxcbiAgICAgIGNoOiAwLFxuICAgIH0pO1xuXG4gICAgbGV0IHZpc2libGVGcm9tID0gdGhpcy52aWV3LnZpc2libGVSYW5nZXNbMF0uZnJvbTtcbiAgICBsZXQgdmlzaWJsZVRvID1cbiAgICAgIHRoaXMudmlldy52aXNpYmxlUmFuZ2VzW3RoaXMudmlldy52aXNpYmxlUmFuZ2VzLmxlbmd0aCAtIDFdLnRvO1xuICAgIGNvbnN0IHpvb21SYW5nZSA9IHRoaXMuZWRpdG9yLmdldFpvb21SYW5nZSgpO1xuICAgIGlmICh6b29tUmFuZ2UpIHtcbiAgICAgIHZpc2libGVGcm9tID0gTWF0aC5tYXgoXG4gICAgICAgIHZpc2libGVGcm9tLFxuICAgICAgICB0aGlzLmVkaXRvci5wb3NUb09mZnNldCh6b29tUmFuZ2UuZnJvbSlcbiAgICAgICk7XG4gICAgICB2aXNpYmxlVG8gPSBNYXRoLm1pbih2aXNpYmxlVG8sIHRoaXMuZWRpdG9yLnBvc1RvT2Zmc2V0KHpvb21SYW5nZS50bykpO1xuICAgIH1cblxuICAgIGlmIChmcm9tT2Zmc2V0ID4gdmlzaWJsZVRvIHx8IHRpbGxPZmZzZXQgPCB2aXNpYmxlRnJvbSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvb3JkcyA9IHRoaXMudmlldy5jb29yZHNBdFBvcyhmcm9tT2Zmc2V0LCAxKTtcbiAgICBpZiAocGFyZW50Q3R4LnJvb3RMZWZ0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhcmVudEN0eC5yb290TGVmdCA9IGNvb3Jkcy5sZWZ0O1xuICAgIH1cbiAgICBjb25zdCBsZWZ0ID0gTWF0aC5mbG9vcihjb29yZHMucmlnaHQgLSBwYXJlbnRDdHgucm9vdExlZnQpO1xuXG4gICAgY29uc3QgdG9wID1cbiAgICAgIHZpc2libGVGcm9tID4gMCAmJiBmcm9tT2Zmc2V0IDwgdmlzaWJsZUZyb21cbiAgICAgICAgPyAtMjBcbiAgICAgICAgOiB0aGlzLnZpZXcubGluZUJsb2NrQXQoZnJvbU9mZnNldCkudG9wO1xuICAgIGNvbnN0IGJvdHRvbSA9XG4gICAgICB0aWxsT2Zmc2V0ID4gdmlzaWJsZVRvXG4gICAgICAgID8gdGhpcy52aWV3LmxpbmVCbG9ja0F0KHZpc2libGVUbyAtIDEpLmJvdHRvbVxuICAgICAgICA6IHRoaXMudmlldy5saW5lQmxvY2tBdCh0aWxsT2Zmc2V0KS5ib3R0b207XG4gICAgY29uc3QgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuXG4gICAgaWYgKGhlaWdodCA+IDAgJiYgIWxpc3QuaXNGb2xkZWQoKSkge1xuICAgICAgY29uc3QgbmV4dFNpYmxpbmcgPSBsaXN0LmdldFBhcmVudCgpLmdldE5leHRTaWJsaW5nT2YobGlzdCk7XG4gICAgICBjb25zdCBoYXNOZXh0U2libGluZyA9XG4gICAgICAgICEhbmV4dFNpYmxpbmcgJiZcbiAgICAgICAgdGhpcy5lZGl0b3IucG9zVG9PZmZzZXQobmV4dFNpYmxpbmcuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkpIDw9XG4gICAgICAgICAgdmlzaWJsZVRvO1xuXG4gICAgICB0aGlzLmxpbmVzLnB1c2goe1xuICAgICAgICB0b3AsXG4gICAgICAgIGxlZnQsXG4gICAgICAgIGhlaWdodDogYGNhbGMoJHtoZWlnaHR9cHggJHtoYXNOZXh0U2libGluZyA/IFwiLSAxLjVlbVwiIDogXCItIDJlbVwifSlgLFxuICAgICAgICBsaXN0LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgaWYgKCFjaGlsZC5pc0VtcHR5KCkpIHtcbiAgICAgICAgdGhpcy5yZWN1cnNpdmUoY2hpbGQsIHBhcmVudEN0eCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNsaWNrID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBjb25zdCBsaW5lID0gdGhpcy5saW5lc1tOdW1iZXIoKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5kYXRhc2V0LmluZGV4KV07XG5cbiAgICBzd2l0Y2ggKHRoaXMuc2V0dGluZ3MudmVydGljYWxMaW5lc0FjdGlvbikge1xuICAgICAgY2FzZSBcInpvb20taW5cIjpcbiAgICAgICAgdGhpcy56b29tSW4obGluZSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwidG9nZ2xlLWZvbGRpbmdcIjpcbiAgICAgICAgdGhpcy50b2dnbGVGb2xkaW5nKGxpbmUpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH07XG5cbiAgcHJpdmF0ZSB6b29tSW4obGluZTogTGluZURhdGEpIHtcbiAgICBjb25zdCBlZGl0b3IgPSBnZXRFZGl0b3JGcm9tU3RhdGUodGhpcy52aWV3LnN0YXRlKTtcblxuICAgIGVkaXRvci56b29tSW4obGluZS5saXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUpO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2dnbGVGb2xkaW5nKGxpbmU6IExpbmVEYXRhKSB7XG4gICAgY29uc3QgeyBsaXN0IH0gPSBsaW5lO1xuXG4gICAgaWYgKGxpc3QuaXNFbXB0eSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IG5lZWRUb1VuZm9sZCA9IHRydWU7XG4gICAgY29uc3QgbGluZXNUb1RvZ2dsZTogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgbGlzdC5nZXRDaGlsZHJlbigpKSB7XG4gICAgICBpZiAoYy5pc0VtcHR5KCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIWMuaXNGb2xkZWQoKSkge1xuICAgICAgICBuZWVkVG9VbmZvbGQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGxpbmVzVG9Ub2dnbGUucHVzaChjLmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUpO1xuICAgIH1cblxuICAgIGNvbnN0IGVkaXRvciA9IGdldEVkaXRvckZyb21TdGF0ZSh0aGlzLnZpZXcuc3RhdGUpO1xuXG4gICAgZm9yIChjb25zdCBsIG9mIGxpbmVzVG9Ub2dnbGUpIHtcbiAgICAgIGlmIChuZWVkVG9VbmZvbGQpIHtcbiAgICAgICAgZWRpdG9yLnVuZm9sZChsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVkaXRvci5mb2xkKGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlRG9tKCkge1xuICAgIGNvbnN0IGNtU2Nyb2xsID0gdGhpcy52aWV3LnNjcm9sbERPTTtcbiAgICBjb25zdCBjbUNvbnRlbnQgPSB0aGlzLnZpZXcuY29udGVudERPTTtcbiAgICBjb25zdCBjbUNvbnRlbnRDb250YWluZXIgPSBjbUNvbnRlbnQucGFyZW50RWxlbWVudDtcbiAgICBjb25zdCBjbVNpemVyID0gY21Db250ZW50Q29udGFpbmVyLnBhcmVudEVsZW1lbnQ7XG5cbiAgICAvKipcbiAgICAgKiBPYnNpZGlhbiBjYW4gYWRkIGFkZGl0aW9uYWwgZWxlbWVudHMgaW50byBDb250ZW50IE1hbmFnZXIuXG4gICAgICogVGhlIG1vc3Qgb2J2aW91cyBjYXNlIGlzIHRoZSAnZW1iZWRkZWQtYmFja2xpbmtzJyBjb3JlIHBsdWdpbiB0aGF0IGFkZHMgYSBtZW51IGluc2lkZSBhIENvbnRlbnQgTWFuYWdlci5cbiAgICAgKiBXZSBtdXN0IHRha2UgaGVpZ2h0cyBvZiBhbGwgb2YgdGhlc2UgZWxlbWVudHMgaW50byBhY2NvdW50XG4gICAgICogdG8gYmUgYWJsZSB0byBjYWxjdWxhdGUgdGhlIGNvcnJlY3Qgc2l6ZSBvZiBsaW5lcycgY29udGFpbmVyLlxuICAgICAqL1xuICAgIGxldCBjbVNpemVyQ2hpbGRyZW5TdW1IZWlnaHQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY21TaXplci5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgY21TaXplckNoaWxkcmVuU3VtSGVpZ2h0ICs9IGNtU2l6ZXIuY2hpbGRyZW5baV0uY2xpZW50SGVpZ2h0O1xuICAgIH1cblxuICAgIHRoaXMuc2Nyb2xsZXIuc3R5bGUudG9wID0gY21TY3JvbGwub2Zmc2V0VG9wICsgXCJweFwiO1xuICAgIHRoaXMuY29udGVudENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBjbVNpemVyQ2hpbGRyZW5TdW1IZWlnaHQgKyBcInB4XCI7XG4gICAgdGhpcy5jb250ZW50Q29udGFpbmVyLnN0eWxlLm1hcmdpbkxlZnQgPVxuICAgICAgY21Db250ZW50Q29udGFpbmVyLm9mZnNldExlZnQgKyBcInB4XCI7XG4gICAgdGhpcy5jb250ZW50Q29udGFpbmVyLnN0eWxlLm1hcmdpblRvcCA9XG4gICAgICAoY21Db250ZW50LmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50KS5vZmZzZXRUb3AgLSAyNCArIFwicHhcIjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5saW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMubGluZUVsZW1lbnRzLmxlbmd0aCA9PT0gaSkge1xuICAgICAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgZS5jbGFzc0xpc3QuYWRkKFwib3V0bGluZXItcGx1Z2luLWxpc3QtbGluZVwiKTtcbiAgICAgICAgZS5kYXRhc2V0LmluZGV4ID0gU3RyaW5nKGkpO1xuICAgICAgICBlLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5vbkNsaWNrKTtcbiAgICAgICAgdGhpcy5jb250ZW50Q29udGFpbmVyLmFwcGVuZENoaWxkKGUpO1xuICAgICAgICB0aGlzLmxpbmVFbGVtZW50cy5wdXNoKGUpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsID0gdGhpcy5saW5lc1tpXTtcbiAgICAgIGNvbnN0IGUgPSB0aGlzLmxpbmVFbGVtZW50c1tpXTtcbiAgICAgIGUuc3R5bGUudG9wID0gbC50b3AgKyBcInB4XCI7XG4gICAgICBlLnN0eWxlLmxlZnQgPSBsLmxlZnQgKyBcInB4XCI7XG4gICAgICBlLnN0eWxlLmhlaWdodCA9IGwuaGVpZ2h0O1xuICAgICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSB0aGlzLmxpbmVzLmxlbmd0aDsgaSA8IHRoaXMubGluZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlID0gdGhpcy5saW5lRWxlbWVudHNbaV07XG4gICAgICBlLnN0eWxlLnRvcCA9IFwiMHB4XCI7XG4gICAgICBlLnN0eWxlLmxlZnQgPSBcIjBweFwiO1xuICAgICAgZS5zdHlsZS5oZWlnaHQgPSBcIjBweFwiO1xuICAgICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLnNldHRpbmdzLnJlbW92ZUNhbGxiYWNrKHRoaXMuc2NoZWR1bGVSZWNhbGN1bGF0ZSk7XG4gICAgdGhpcy52aWV3LnNjcm9sbERPTS5yZW1vdmVFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHRoaXMub25TY3JvbGwpO1xuICAgIHRoaXMudmlldy5kb20ucmVtb3ZlQ2hpbGQodGhpcy5zY3JvbGxlcik7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuc2NoZWR1bGVkKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmVydGljYWxMaW5lcyBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBwcml2YXRlIHVwZGF0ZUJvZHlDbGFzc0ludGVydmFsOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbl8yLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb2JzaWRpYW5TZXR0aW5nczogT2JzaWRpYW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMudXBkYXRlQm9keUNsYXNzKCk7XG4gICAgdGhpcy51cGRhdGVCb2R5Q2xhc3NJbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZUJvZHlDbGFzcygpO1xuICAgIH0sIDEwMDApO1xuXG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oXG4gICAgICBWaWV3UGx1Z2luLmRlZmluZShcbiAgICAgICAgKHZpZXcpID0+XG4gICAgICAgICAgbmV3IFZlcnRpY2FsTGluZXNQbHVnaW5WYWx1ZShcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgICAgICB0aGlzLnBhcnNlcixcbiAgICAgICAgICAgIHZpZXdcbiAgICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMudXBkYXRlQm9keUNsYXNzSW50ZXJ2YWwpO1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShWRVJUSUNBTF9MSU5FU19CT0RZX0NMQVNTKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQm9keUNsYXNzID0gKCkgPT4ge1xuICAgIGNvbnN0IHNob3VsZEV4aXN0cyA9XG4gICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MuaXNEZWZhdWx0VGhlbWVFbmFibGVkKCkgJiZcbiAgICAgIHRoaXMuc2V0dGluZ3MudmVydGljYWxMaW5lcztcbiAgICBjb25zdCBleGlzdHMgPSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhWRVJUSUNBTF9MSU5FU19CT0RZX0NMQVNTKTtcblxuICAgIGlmIChzaG91bGRFeGlzdHMgJiYgIWV4aXN0cykge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKFZFUlRJQ0FMX0xJTkVTX0JPRFlfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmICghc2hvdWxkRXhpc3RzICYmIGV4aXN0cykge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKFZFUlRJQ0FMX0xJTkVTX0JPRFlfQ0xBU1MpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgTGlzdCwgUG9zaXRpb24sIFJvb3QsIGlzUmFuZ2VzSW50ZXJzZWN0cyB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VzQXBwbGljYXRvciB7XG4gIGFwcGx5KGVkaXRvcjogTXlFZGl0b3IsIHByZXZSb290OiBSb290LCBuZXdSb290OiBSb290KSB7XG4gICAgY29uc3QgY2hhbmdlcyA9IHRoaXMuY2FsY3VsYXRlQ2hhbmdlcyhlZGl0b3IsIHByZXZSb290LCBuZXdSb290KTtcbiAgICBpZiAoY2hhbmdlcykge1xuICAgICAgY29uc3QgeyByZXBsYWNlbWVudCwgY2hhbmdlRnJvbSwgY2hhbmdlVG8gfSA9IGNoYW5nZXM7XG5cbiAgICAgIGNvbnN0IHsgdW5mb2xkLCBmb2xkIH0gPSB0aGlzLmNhbGN1bGF0ZUZvbGRpbmdPcHJhdGlvbnMoXG4gICAgICAgIHByZXZSb290LFxuICAgICAgICBuZXdSb290LFxuICAgICAgICBjaGFuZ2VGcm9tLFxuICAgICAgICBjaGFuZ2VUb1xuICAgICAgKTtcblxuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIHVuZm9sZCkge1xuICAgICAgICBlZGl0b3IudW5mb2xkKGxpbmUpO1xuICAgICAgfVxuXG4gICAgICBlZGl0b3IucmVwbGFjZVJhbmdlKHJlcGxhY2VtZW50LCBjaGFuZ2VGcm9tLCBjaGFuZ2VUbyk7XG5cbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBmb2xkKSB7XG4gICAgICAgIGVkaXRvci5mb2xkKGxpbmUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGVkaXRvci5zZXRTZWxlY3Rpb25zKG5ld1Jvb3QuZ2V0U2VsZWN0aW9ucygpKTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlQ2hhbmdlcyhlZGl0b3I6IE15RWRpdG9yLCBwcmV2Um9vdDogUm9vdCwgbmV3Um9vdDogUm9vdCkge1xuICAgIGNvbnN0IHJvb3RSYW5nZSA9IHByZXZSb290LmdldENvbnRlbnRSYW5nZSgpO1xuICAgIGNvbnN0IG9sZFN0cmluZyA9IGVkaXRvci5nZXRSYW5nZShyb290UmFuZ2VbMF0sIHJvb3RSYW5nZVsxXSk7XG4gICAgY29uc3QgbmV3U3RyaW5nID0gbmV3Um9vdC5wcmludCgpO1xuXG4gICAgY29uc3QgY2hhbmdlRnJvbSA9IHsgLi4ucm9vdFJhbmdlWzBdIH07XG4gICAgY29uc3QgY2hhbmdlVG8gPSB7IC4uLnJvb3RSYW5nZVsxXSB9O1xuICAgIGxldCBvbGRUbXAgPSBvbGRTdHJpbmc7XG4gICAgbGV0IG5ld1RtcCA9IG5ld1N0cmluZztcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBubEluZGV4ID0gb2xkVG1wLmxhc3RJbmRleE9mKFwiXFxuXCIpO1xuXG4gICAgICBpZiAobmxJbmRleCA8IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9sZExpbmUgPSBvbGRUbXAuc2xpY2UobmxJbmRleCk7XG4gICAgICBjb25zdCBuZXdMaW5lID0gbmV3VG1wLnNsaWNlKC1vbGRMaW5lLmxlbmd0aCk7XG5cbiAgICAgIGlmIChvbGRMaW5lICE9PSBuZXdMaW5lKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBvbGRUbXAgPSBvbGRUbXAuc2xpY2UoMCwgLW9sZExpbmUubGVuZ3RoKTtcbiAgICAgIG5ld1RtcCA9IG5ld1RtcC5zbGljZSgwLCAtb2xkTGluZS5sZW5ndGgpO1xuICAgICAgY29uc3QgbmxJbmRleDIgPSBvbGRUbXAubGFzdEluZGV4T2YoXCJcXG5cIik7XG4gICAgICBjaGFuZ2VUby5jaCA9XG4gICAgICAgIG5sSW5kZXgyID49IDAgPyBvbGRUbXAubGVuZ3RoIC0gbmxJbmRleDIgLSAxIDogb2xkVG1wLmxlbmd0aDtcbiAgICAgIGNoYW5nZVRvLmxpbmUtLTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgbmxJbmRleCA9IG9sZFRtcC5pbmRleE9mKFwiXFxuXCIpO1xuXG4gICAgICBpZiAobmxJbmRleCA8IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9sZExpbmUgPSBvbGRUbXAuc2xpY2UoMCwgbmxJbmRleCArIDEpO1xuICAgICAgY29uc3QgbmV3TGluZSA9IG5ld1RtcC5zbGljZSgwLCBvbGRMaW5lLmxlbmd0aCk7XG5cbiAgICAgIGlmIChvbGRMaW5lICE9PSBuZXdMaW5lKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjaGFuZ2VGcm9tLmxpbmUrKztcbiAgICAgIG9sZFRtcCA9IG9sZFRtcC5zbGljZShvbGRMaW5lLmxlbmd0aCk7XG4gICAgICBuZXdUbXAgPSBuZXdUbXAuc2xpY2Uob2xkTGluZS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChvbGRUbXAgPT09IG5ld1RtcCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlcGxhY2VtZW50OiBuZXdUbXAsXG4gICAgICBjaGFuZ2VGcm9tLFxuICAgICAgY2hhbmdlVG8sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlRm9sZGluZ09wcmF0aW9ucyhcbiAgICBwcmV2Um9vdDogUm9vdCxcbiAgICBuZXdSb290OiBSb290LFxuICAgIGNoYW5nZUZyb206IFBvc2l0aW9uLFxuICAgIGNoYW5nZVRvOiBQb3NpdGlvblxuICApIHtcbiAgICBjb25zdCBjaGFuZ2VkUmFuZ2U6IFtQb3NpdGlvbiwgUG9zaXRpb25dID0gW2NoYW5nZUZyb20sIGNoYW5nZVRvXTtcblxuICAgIGNvbnN0IHByZXZMaXN0cyA9IGdldEFsbENoaWxkcmVuKHByZXZSb290KTtcbiAgICBjb25zdCBuZXdMaXN0cyA9IGdldEFsbENoaWxkcmVuKG5ld1Jvb3QpO1xuXG4gICAgY29uc3QgdW5mb2xkOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGZvbGQ6IG51bWJlcltdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHByZXZMaXN0IG9mIHByZXZMaXN0cy52YWx1ZXMoKSkge1xuICAgICAgaWYgKCFwcmV2TGlzdC5pc0ZvbGRSb290KCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0xpc3QgPSBuZXdMaXN0cy5nZXQocHJldkxpc3QuZ2V0SUQoKSk7XG5cbiAgICAgIGlmICghbmV3TGlzdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJldkxpc3RSYW5nZTogW1Bvc2l0aW9uLCBQb3NpdGlvbl0gPSBbXG4gICAgICAgIHByZXZMaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLFxuICAgICAgICBwcmV2TGlzdC5nZXRDb250ZW50RW5kSW5jbHVkaW5nQ2hpbGRyZW4oKSxcbiAgICAgIF07XG5cbiAgICAgIGlmIChpc1Jhbmdlc0ludGVyc2VjdHMocHJldkxpc3RSYW5nZSwgY2hhbmdlZFJhbmdlKSkge1xuICAgICAgICB1bmZvbGQucHVzaChwcmV2TGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lKTtcbiAgICAgICAgZm9sZC5wdXNoKG5ld0xpc3QuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdW5mb2xkLnNvcnQoKGEsIGIpID0+IGIgLSBhKTtcbiAgICBmb2xkLnNvcnQoKGEsIGIpID0+IGIgLSBhKTtcblxuICAgIHJldHVybiB7IHVuZm9sZCwgZm9sZCB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFsbENoaWxkcmVuUmVkdWNlRm4oYWNjOiBNYXA8bnVtYmVyLCBMaXN0PiwgY2hpbGQ6IExpc3QpIHtcbiAgYWNjLnNldChjaGlsZC5nZXRJRCgpLCBjaGlsZCk7XG4gIGNoaWxkLmdldENoaWxkcmVuKCkucmVkdWNlKGdldEFsbENoaWxkcmVuUmVkdWNlRm4sIGFjYyk7XG5cbiAgcmV0dXJuIGFjYztcbn1cblxuZnVuY3Rpb24gZ2V0QWxsQ2hpbGRyZW4ocm9vdDogUm9vdCk6IE1hcDxudW1iZXIsIExpc3Q+IHtcbiAgcmV0dXJuIHJvb3QuZ2V0Q2hpbGRyZW4oKS5yZWR1Y2UoZ2V0QWxsQ2hpbGRyZW5SZWR1Y2VGbiwgbmV3IE1hcCgpKTtcbn1cbiIsImltcG9ydCB7IFBsYXRmb3JtIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBJTUVEZXRlY3RvciB7XG4gIHByaXZhdGUgY29tcG9zaXRpb24gPSBmYWxzZTtcblxuICBhc3luYyBsb2FkKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjb21wb3NpdGlvbnN0YXJ0XCIsIHRoaXMub25Db21wb3NpdGlvblN0YXJ0KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY29tcG9zaXRpb25lbmRcIiwgdGhpcy5vbkNvbXBvc2l0aW9uRW5kKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY29tcG9zaXRpb25lbmRcIiwgdGhpcy5vbkNvbXBvc2l0aW9uRW5kKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY29tcG9zaXRpb25zdGFydFwiLCB0aGlzLm9uQ29tcG9zaXRpb25TdGFydCk7XG4gIH1cblxuICBpc09wZW5lZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbiAmJiBQbGF0Zm9ybS5pc0Rlc2t0b3A7XG4gIH1cblxuICBwcml2YXRlIG9uQ29tcG9zaXRpb25TdGFydCA9ICgpID0+IHtcbiAgICB0aGlzLmNvbXBvc2l0aW9uID0gdHJ1ZTtcbiAgfTtcblxuICBwcml2YXRlIG9uQ29tcG9zaXRpb25FbmQgPSAoKSA9PiB7XG4gICAgdGhpcy5jb21wb3NpdGlvbiA9IGZhbHNlO1xuICB9O1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi9TZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MpIHt9XG5cbiAgbG9nKG1ldGhvZDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5kZWJ1Zykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnNvbGUuaW5mbyhtZXRob2QsIC4uLmFyZ3MpO1xuICB9XG5cbiAgYmluZChtZXRob2Q6IHN0cmluZykge1xuICAgIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IHRoaXMubG9nKG1ldGhvZCwgLi4uYXJncyk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEFwcCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2lkaWFuVGFic1NldHRpbmdzIHtcbiAgdXNlVGFiOiBib29sZWFuO1xuICB0YWJTaXplOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JzaWRpYW5Gb2xkU2V0dGluZ3Mge1xuICBmb2xkSW5kZW50OiBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBnZXRIaWRkZW5PYnNpZGlhbkNvbmZpZyhhcHA6IEFwcCkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICByZXR1cm4gKGFwcC52YXVsdCBhcyBhbnkpLmNvbmZpZztcbn1cblxuZXhwb3J0IGNsYXNzIE9ic2lkaWFuU2V0dGluZ3Mge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwKSB7fVxuXG4gIGlzTGVnYWN5RWRpdG9yRW5hYmxlZCgpIHtcbiAgICBjb25zdCBjb25maWc6IHsgbGVnYWN5RWRpdG9yOiBib29sZWFuIH0gPSB7XG4gICAgICBsZWdhY3lFZGl0b3I6IGZhbHNlLFxuICAgICAgLi4uZ2V0SGlkZGVuT2JzaWRpYW5Db25maWcodGhpcy5hcHApLFxuICAgIH07XG5cbiAgICByZXR1cm4gY29uZmlnLmxlZ2FjeUVkaXRvcjtcbiAgfVxuXG4gIGlzRGVmYXVsdFRoZW1lRW5hYmxlZCgpIHtcbiAgICBjb25zdCBjb25maWc6IHsgY3NzVGhlbWU6IHN0cmluZyB9ID0ge1xuICAgICAgY3NzVGhlbWU6IFwiXCIsXG4gICAgICAuLi5nZXRIaWRkZW5PYnNpZGlhbkNvbmZpZyh0aGlzLmFwcCksXG4gICAgfTtcblxuICAgIHJldHVybiBjb25maWcuY3NzVGhlbWUgPT09IFwiXCI7XG4gIH1cblxuICBnZXRUYWJzU2V0dGluZ3MoKTogT2JzaWRpYW5UYWJzU2V0dGluZ3Mge1xuICAgIHJldHVybiB7XG4gICAgICB1c2VUYWI6IHRydWUsXG4gICAgICB0YWJTaXplOiA0LFxuICAgICAgLi4uZ2V0SGlkZGVuT2JzaWRpYW5Db25maWcodGhpcy5hcHApLFxuICAgIH07XG4gIH1cblxuICBnZXRGb2xkU2V0dGluZ3MoKTogT2JzaWRpYW5Gb2xkU2V0dGluZ3Mge1xuICAgIHJldHVybiB7XG4gICAgICBmb2xkSW5kZW50OiB0cnVlLFxuICAgICAgLi4uZ2V0SGlkZGVuT2JzaWRpYW5Db25maWcodGhpcy5hcHApLFxuICAgIH07XG4gIH1cblxuICBnZXREZWZhdWx0SW5kZW50Q2hhcnMoKSB7XG4gICAgY29uc3QgeyB1c2VUYWIsIHRhYlNpemUgfSA9IHRoaXMuZ2V0VGFic1NldHRpbmdzKCk7XG5cbiAgICByZXR1cm4gdXNlVGFiID8gXCJcXHRcIiA6IG5ldyBBcnJheSh0YWJTaXplKS5maWxsKFwiIFwiKS5qb2luKFwiXCIpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBDaGFuZ2VzQXBwbGljYXRvciB9IGZyb20gXCIuL0NoYW5nZXNBcHBsaWNhdG9yXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9QYXJzZXJcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9PcGVyYXRpb25cIjtcbmltcG9ydCB7IFJvb3QgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgT3BlcmF0aW9uUGVyZm9ybWVyIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcbiAgICBwcml2YXRlIGNoYW5nZXNBcHBsaWNhdG9yOiBDaGFuZ2VzQXBwbGljYXRvclxuICApIHt9XG5cbiAgZXZhbChyb290OiBSb290LCBvcDogT3BlcmF0aW9uLCBlZGl0b3I6IE15RWRpdG9yKSB7XG4gICAgY29uc3QgcHJldlJvb3QgPSByb290LmNsb25lKCk7XG5cbiAgICBvcC5wZXJmb3JtKCk7XG5cbiAgICBpZiAob3Auc2hvdWxkVXBkYXRlKCkpIHtcbiAgICAgIHRoaXMuY2hhbmdlc0FwcGxpY2F0b3IuYXBwbHkoZWRpdG9yLCBwcmV2Um9vdCwgcm9vdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNob3VsZFVwZGF0ZTogb3Auc2hvdWxkVXBkYXRlKCksXG4gICAgICBzaG91bGRTdG9wUHJvcGFnYXRpb246IG9wLnNob3VsZFN0b3BQcm9wYWdhdGlvbigpLFxuICAgIH07XG4gIH1cblxuICBwZXJmb3JtKFxuICAgIGNiOiAocm9vdDogUm9vdCkgPT4gT3BlcmF0aW9uLFxuICAgIGVkaXRvcjogTXlFZGl0b3IsXG4gICAgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvcigpXG4gICkge1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLnBhcnNlci5wYXJzZShlZGl0b3IsIGN1cnNvcik7XG5cbiAgICBpZiAoIXJvb3QpIHtcbiAgICAgIHJldHVybiB7IHNob3VsZFVwZGF0ZTogZmFsc2UsIHNob3VsZFN0b3BQcm9wYWdhdGlvbjogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBjb25zdCBvcCA9IGNiKHJvb3QpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXZhbChyb290LCBvcCwgZWRpdG9yKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4vTG9nZ2VyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuL1NldHRpbmdzXCI7XG5cbmltcG9ydCB7IExpc3QsIFJvb3QgfSBmcm9tIFwiLi4vcm9vdFwiO1xuaW1wb3J0IHsgY2hlY2tib3hSZSB9IGZyb20gXCIuLi91dGlscy9jaGVja2JveFJlXCI7XG5cbmNvbnN0IGJ1bGxldFNpZ25SZSA9IGAoPzpbLSorXXxcXFxcZCtcXFxcLilgO1xuY29uc3Qgb3B0aW9uYWxDaGVja2JveFJlID0gYCg/OiR7Y2hlY2tib3hSZX0pP2A7XG5cbmNvbnN0IGxpc3RJdGVtV2l0aG91dFNwYWNlc1JlID0gbmV3IFJlZ0V4cChgXiR7YnVsbGV0U2lnblJlfSggfFxcdClgKTtcbmNvbnN0IGxpc3RJdGVtUmUgPSBuZXcgUmVnRXhwKGBeWyBcXHRdKiR7YnVsbGV0U2lnblJlfSggfFxcdClgKTtcbmNvbnN0IHN0cmluZ1dpdGhTcGFjZXNSZSA9IG5ldyBSZWdFeHAoYF5bIFxcdF0rYCk7XG5jb25zdCBwYXJzZUxpc3RJdGVtUmUgPSBuZXcgUmVnRXhwKFxuICBgXihbIFxcdF0qKSgke2J1bGxldFNpZ25SZX0pKCB8XFx0KSgke29wdGlvbmFsQ2hlY2tib3hSZX0pKC4qKSRgXG4pO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRlclBvc2l0aW9uIHtcbiAgbGluZTogbnVtYmVyO1xuICBjaDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRlclNlbGVjdGlvbiB7XG4gIGFuY2hvcjogUmVhZGVyUG9zaXRpb247XG4gIGhlYWQ6IFJlYWRlclBvc2l0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRlciB7XG4gIGdldEN1cnNvcigpOiBSZWFkZXJQb3NpdGlvbjtcbiAgZ2V0TGluZShuOiBudW1iZXIpOiBzdHJpbmc7XG4gIGxhc3RMaW5lKCk6IG51bWJlcjtcbiAgbGlzdFNlbGVjdGlvbnMoKTogUmVhZGVyU2VsZWN0aW9uW107XG4gIGdldEFsbEZvbGRlZExpbmVzKCk6IG51bWJlcltdO1xufVxuXG5pbnRlcmZhY2UgUGFyc2VMaXN0TGlzdCB7XG4gIGdldEZpcnN0TGluZUluZGVudCgpOiBzdHJpbmc7XG4gIHNldE5vdGVzSW5kZW50KG5vdGVzSW5kZW50OiBzdHJpbmcpOiB2b2lkO1xuICBnZXROb3Rlc0luZGVudCgpOiBzdHJpbmcgfCBudWxsO1xuICBhZGRMaW5lKHRleHQ6IHN0cmluZyk6IHZvaWQ7XG4gIGdldFBhcmVudCgpOiBQYXJzZUxpc3RMaXN0IHwgbnVsbDtcbiAgYWRkQWZ0ZXJBbGwobGlzdDogUGFyc2VMaXN0TGlzdCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxvZ2dlcjogTG9nZ2VyLCBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncykge31cblxuICBwYXJzZVJhbmdlKGVkaXRvcjogUmVhZGVyLCBmcm9tTGluZSA9IDAsIHRvTGluZSA9IGVkaXRvci5sYXN0TGluZSgpKTogUm9vdFtdIHtcbiAgICBjb25zdCBsaXN0czogUm9vdFtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gZnJvbUxpbmU7IGkgPD0gdG9MaW5lOyBpKyspIHtcbiAgICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0TGluZShpKTtcblxuICAgICAgaWYgKGkgPT09IGZyb21MaW5lIHx8IHRoaXMuaXNMaXN0SXRlbShsaW5lKSkge1xuICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5wYXJzZVdpdGhMaW1pdHMoZWRpdG9yLCBpLCBmcm9tTGluZSwgdG9MaW5lKTtcblxuICAgICAgICBpZiAobGlzdCkge1xuICAgICAgICAgIGxpc3RzLnB1c2gobGlzdCk7XG4gICAgICAgICAgaSA9IGxpc3QuZ2V0Q29udGVudEVuZCgpLmxpbmU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGlzdHM7XG4gIH1cblxuICBwYXJzZShlZGl0b3I6IFJlYWRlciwgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvcigpKTogUm9vdCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnBhcnNlV2l0aExpbWl0cyhlZGl0b3IsIGN1cnNvci5saW5lLCAwLCBlZGl0b3IubGFzdExpbmUoKSk7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlV2l0aExpbWl0cyhcbiAgICBlZGl0b3I6IFJlYWRlcixcbiAgICBwYXJzaW5nU3RhcnRMaW5lOiBudW1iZXIsXG4gICAgbGltaXRGcm9tOiBudW1iZXIsXG4gICAgbGltaXRUbzogbnVtYmVyXG4gICk6IFJvb3QgfCBudWxsIHtcbiAgICBjb25zdCBkID0gdGhpcy5sb2dnZXIuYmluZChcInBhcnNlTGlzdFwiKTtcbiAgICBjb25zdCBlcnJvciA9IChtc2c6IHN0cmluZyk6IG51bGwgPT4ge1xuICAgICAgZChtc2cpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcblxuICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0TGluZShwYXJzaW5nU3RhcnRMaW5lKTtcblxuICAgIGxldCBsaXN0TG9va2luZ1BvczogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5pc0xpc3RJdGVtKGxpbmUpKSB7XG4gICAgICBsaXN0TG9va2luZ1BvcyA9IHBhcnNpbmdTdGFydExpbmU7XG4gICAgfSBlbHNlIGlmICh0aGlzLmlzTGluZVdpdGhJbmRlbnQobGluZSkpIHtcbiAgICAgIGxldCBsaXN0TG9va2luZ1Bvc1NlYXJjaCA9IHBhcnNpbmdTdGFydExpbmUgLSAxO1xuICAgICAgd2hpbGUgKGxpc3RMb29raW5nUG9zU2VhcmNoID49IDApIHtcbiAgICAgICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRMaW5lKGxpc3RMb29raW5nUG9zU2VhcmNoKTtcbiAgICAgICAgaWYgKHRoaXMuaXNMaXN0SXRlbShsaW5lKSkge1xuICAgICAgICAgIGxpc3RMb29raW5nUG9zID0gbGlzdExvb2tpbmdQb3NTZWFyY2g7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc0xpbmVXaXRoSW5kZW50KGxpbmUpKSB7XG4gICAgICAgICAgbGlzdExvb2tpbmdQb3NTZWFyY2gtLTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsaXN0TG9va2luZ1BvcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IGxpc3RTdGFydExpbmU6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBsaXN0U3RhcnRMaW5lTG9va3VwID0gbGlzdExvb2tpbmdQb3M7XG4gICAgd2hpbGUgKGxpc3RTdGFydExpbmVMb29rdXAgPj0gMCkge1xuICAgICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRMaW5lKGxpc3RTdGFydExpbmVMb29rdXApO1xuICAgICAgaWYgKCF0aGlzLmlzTGlzdEl0ZW0obGluZSkgJiYgIXRoaXMuaXNMaW5lV2l0aEluZGVudChsaW5lKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzTGlzdEl0ZW1XaXRob3V0U3BhY2VzKGxpbmUpKSB7XG4gICAgICAgIGxpc3RTdGFydExpbmUgPSBsaXN0U3RhcnRMaW5lTG9va3VwO1xuICAgICAgICBpZiAobGlzdFN0YXJ0TGluZUxvb2t1cCA8PSBsaW1pdEZyb20pIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdFN0YXJ0TGluZUxvb2t1cC0tO1xuICAgIH1cblxuICAgIGlmIChsaXN0U3RhcnRMaW5lID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgbGlzdEVuZExpbmUgPSBsaXN0TG9va2luZ1BvcztcbiAgICBsZXQgbGlzdEVuZExpbmVMb29rdXAgPSBsaXN0TG9va2luZ1BvcztcbiAgICB3aGlsZSAobGlzdEVuZExpbmVMb29rdXAgPD0gZWRpdG9yLmxhc3RMaW5lKCkpIHtcbiAgICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0TGluZShsaXN0RW5kTGluZUxvb2t1cCk7XG4gICAgICBpZiAoIXRoaXMuaXNMaXN0SXRlbShsaW5lKSAmJiAhdGhpcy5pc0xpbmVXaXRoSW5kZW50KGxpbmUpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzRW1wdHlMaW5lKGxpbmUpKSB7XG4gICAgICAgIGxpc3RFbmRMaW5lID0gbGlzdEVuZExpbmVMb29rdXA7XG4gICAgICB9XG4gICAgICBpZiAobGlzdEVuZExpbmVMb29rdXAgPj0gbGltaXRUbykge1xuICAgICAgICBsaXN0RW5kTGluZSA9IGxpbWl0VG87XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGlzdEVuZExpbmVMb29rdXArKztcbiAgICB9XG5cbiAgICBpZiAobGlzdFN0YXJ0TGluZSA+IHBhcnNpbmdTdGFydExpbmUgfHwgbGlzdEVuZExpbmUgPCBwYXJzaW5nU3RhcnRMaW5lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBpZiB0aGUgbGFzdCBsaW5lIGNvbnRhaW5zIG9ubHkgc3BhY2VzIGFuZCB0aGF0J3MgaW5jb3JyZWN0IGluZGVudCwgdGhlbiBpZ25vcmUgdGhlIGxhc3QgbGluZVxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92c2xpbmtvL29ic2lkaWFuLW91dGxpbmVyL2lzc3Vlcy8zNjhcbiAgICBpZiAobGlzdEVuZExpbmUgPiBsaXN0U3RhcnRMaW5lKSB7XG4gICAgICBjb25zdCBsYXN0TGluZSA9IGVkaXRvci5nZXRMaW5lKGxpc3RFbmRMaW5lKTtcbiAgICAgIGlmIChsYXN0TGluZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IHByZXZMaW5lID0gZWRpdG9yLmdldExpbmUobGlzdEVuZExpbmUgLSAxKTtcbiAgICAgICAgY29uc3QgWywgcHJldkxpbmVJbmRlbnRdID0gL14oXFxzKikvLmV4ZWMocHJldkxpbmUpO1xuICAgICAgICBpZiAoIWxhc3RMaW5lLnN0YXJ0c1dpdGgocHJldkxpbmVJbmRlbnQpKSB7XG4gICAgICAgICAgbGlzdEVuZExpbmUtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHJvb3QgPSBuZXcgUm9vdChcbiAgICAgIHsgbGluZTogbGlzdFN0YXJ0TGluZSwgY2g6IDAgfSxcbiAgICAgIHsgbGluZTogbGlzdEVuZExpbmUsIGNoOiBlZGl0b3IuZ2V0TGluZShsaXN0RW5kTGluZSkubGVuZ3RoIH0sXG4gICAgICBlZGl0b3IubGlzdFNlbGVjdGlvbnMoKS5tYXAoKHIpID0+ICh7XG4gICAgICAgIGFuY2hvcjogeyBsaW5lOiByLmFuY2hvci5saW5lLCBjaDogci5hbmNob3IuY2ggfSxcbiAgICAgICAgaGVhZDogeyBsaW5lOiByLmhlYWQubGluZSwgY2g6IHIuaGVhZC5jaCB9LFxuICAgICAgfSkpXG4gICAgKTtcblxuICAgIGxldCBjdXJyZW50UGFyZW50OiBQYXJzZUxpc3RMaXN0ID0gcm9vdC5nZXRSb290TGlzdCgpO1xuICAgIGxldCBjdXJyZW50TGlzdDogUGFyc2VMaXN0TGlzdCB8IG51bGwgPSBudWxsO1xuICAgIGxldCBjdXJyZW50SW5kZW50ID0gXCJcIjtcblxuICAgIGNvbnN0IGZvbGRlZExpbmVzID0gZWRpdG9yLmdldEFsbEZvbGRlZExpbmVzKCk7XG5cbiAgICBmb3IgKGxldCBsID0gbGlzdFN0YXJ0TGluZTsgbCA8PSBsaXN0RW5kTGluZTsgbCsrKSB7XG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldExpbmUobCk7XG4gICAgICBjb25zdCBtYXRjaGVzID0gcGFyc2VMaXN0SXRlbVJlLmV4ZWMobGluZSk7XG5cbiAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgIGNvbnN0IFssIGluZGVudCwgYnVsbGV0LCBzcGFjZUFmdGVyQnVsbGV0XSA9IG1hdGNoZXM7XG4gICAgICAgIGxldCBbLCAsICwgLCBvcHRpb25hbENoZWNrYm94LCBjb250ZW50XSA9IG1hdGNoZXM7XG5cbiAgICAgICAgY29udGVudCA9IG9wdGlvbmFsQ2hlY2tib3ggKyBjb250ZW50O1xuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5rZWVwQ3Vyc29yV2l0aGluQ29udGVudCAhPT0gXCJidWxsZXQtYW5kLWNoZWNrYm94XCIpIHtcbiAgICAgICAgICBvcHRpb25hbENoZWNrYm94ID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBhcmVMZW5ndGggPSBNYXRoLm1pbihjdXJyZW50SW5kZW50Lmxlbmd0aCwgaW5kZW50Lmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGluZGVudFNsaWNlID0gaW5kZW50LnNsaWNlKDAsIGNvbXBhcmVMZW5ndGgpO1xuICAgICAgICBjb25zdCBjdXJyZW50SW5kZW50U2xpY2UgPSBjdXJyZW50SW5kZW50LnNsaWNlKDAsIGNvbXBhcmVMZW5ndGgpO1xuXG4gICAgICAgIGlmIChpbmRlbnRTbGljZSAhPT0gY3VycmVudEluZGVudFNsaWNlKSB7XG4gICAgICAgICAgY29uc3QgZXhwZWN0ZWQgPSBjdXJyZW50SW5kZW50U2xpY2VcbiAgICAgICAgICAgIC5yZXBsYWNlKC8gL2csIFwiU1wiKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcdC9nLCBcIlRcIik7XG4gICAgICAgICAgY29uc3QgZ290ID0gaW5kZW50U2xpY2UucmVwbGFjZSgvIC9nLCBcIlNcIikucmVwbGFjZSgvXFx0L2csIFwiVFwiKTtcblxuICAgICAgICAgIHJldHVybiBlcnJvcihcbiAgICAgICAgICAgIGBVbmFibGUgdG8gcGFyc2UgbGlzdDogZXhwZWN0ZWQgaW5kZW50IFwiJHtleHBlY3RlZH1cIiwgZ290IFwiJHtnb3R9XCJgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmRlbnQubGVuZ3RoID4gY3VycmVudEluZGVudC5sZW5ndGgpIHtcbiAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudExpc3Q7XG4gICAgICAgICAgY3VycmVudEluZGVudCA9IGluZGVudDtcbiAgICAgICAgfSBlbHNlIGlmIChpbmRlbnQubGVuZ3RoIDwgY3VycmVudEluZGVudC5sZW5ndGgpIHtcbiAgICAgICAgICB3aGlsZSAoXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmdldEZpcnN0TGluZUluZGVudCgpLmxlbmd0aCA+PSBpbmRlbnQubGVuZ3RoICYmXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmdldFBhcmVudCgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5nZXRQYXJlbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudEluZGVudCA9IGluZGVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvbGRSb290ID0gZm9sZGVkTGluZXMuaW5jbHVkZXMobCk7XG5cbiAgICAgICAgY3VycmVudExpc3QgPSBuZXcgTGlzdChcbiAgICAgICAgICByb290LFxuICAgICAgICAgIGluZGVudCxcbiAgICAgICAgICBidWxsZXQsXG4gICAgICAgICAgb3B0aW9uYWxDaGVja2JveCxcbiAgICAgICAgICBzcGFjZUFmdGVyQnVsbGV0LFxuICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgZm9sZFJvb3RcbiAgICAgICAgKTtcbiAgICAgICAgY3VycmVudFBhcmVudC5hZGRBZnRlckFsbChjdXJyZW50TGlzdCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMaW5lV2l0aEluZGVudChsaW5lKSkge1xuICAgICAgICBpZiAoIWN1cnJlbnRMaXN0KSB7XG4gICAgICAgICAgcmV0dXJuIGVycm9yKFxuICAgICAgICAgICAgYFVuYWJsZSB0byBwYXJzZSBsaXN0OiBleHBlY3RlZCBsaXN0IGl0ZW0sIGdvdCBlbXB0eSBsaW5lYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRlbnRUb0NoZWNrID0gY3VycmVudExpc3QuZ2V0Tm90ZXNJbmRlbnQoKSB8fCBjdXJyZW50SW5kZW50O1xuXG4gICAgICAgIGlmIChsaW5lLmluZGV4T2YoaW5kZW50VG9DaGVjaykgIT09IDApIHtcbiAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IGluZGVudFRvQ2hlY2sucmVwbGFjZSgvIC9nLCBcIlNcIikucmVwbGFjZSgvXFx0L2csIFwiVFwiKTtcbiAgICAgICAgICBjb25zdCBnb3QgPSBsaW5lXG4gICAgICAgICAgICAubWF0Y2goL15bIFxcdF0qLylbMF1cbiAgICAgICAgICAgIC5yZXBsYWNlKC8gL2csIFwiU1wiKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcdC9nLCBcIlRcIik7XG5cbiAgICAgICAgICByZXR1cm4gZXJyb3IoXG4gICAgICAgICAgICBgVW5hYmxlIHRvIHBhcnNlIGxpc3Q6IGV4cGVjdGVkIGluZGVudCBcIiR7ZXhwZWN0ZWR9XCIsIGdvdCBcIiR7Z290fVwiYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWN1cnJlbnRMaXN0LmdldE5vdGVzSW5kZW50KCkpIHtcbiAgICAgICAgICBjb25zdCBtYXRjaGVzID0gbGluZS5tYXRjaCgvXlsgXFx0XSsvKTtcblxuICAgICAgICAgIGlmICghbWF0Y2hlcyB8fCBtYXRjaGVzWzBdLmxlbmd0aCA8PSBjdXJyZW50SW5kZW50Lmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKC9eXFxzKyQvLnRlc3QobGluZSkpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBlcnJvcihcbiAgICAgICAgICAgICAgYFVuYWJsZSB0byBwYXJzZSBsaXN0OiBleHBlY3RlZCBzb21lIGluZGVudCwgZ290IG5vIGluZGVudGBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudExpc3Quc2V0Tm90ZXNJbmRlbnQobWF0Y2hlc1swXSk7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50TGlzdC5hZGRMaW5lKGxpbmUuc2xpY2UoY3VycmVudExpc3QuZ2V0Tm90ZXNJbmRlbnQoKS5sZW5ndGgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlcnJvcihcbiAgICAgICAgICBgVW5hYmxlIHRvIHBhcnNlIGxpc3Q6IGV4cGVjdGVkIGxpc3QgaXRlbSBvciBub3RlLCBnb3QgXCIke2xpbmV9XCJgXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3Q7XG4gIH1cblxuICBwcml2YXRlIGlzRW1wdHlMaW5lKGxpbmU6IHN0cmluZykge1xuICAgIHJldHVybiBsaW5lLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIHByaXZhdGUgaXNMaW5lV2l0aEluZGVudChsaW5lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nV2l0aFNwYWNlc1JlLnRlc3QobGluZSk7XG4gIH1cblxuICBwcml2YXRlIGlzTGlzdEl0ZW0obGluZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGxpc3RJdGVtUmUudGVzdChsaW5lKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNMaXN0SXRlbVdpdGhvdXRTcGFjZXMobGluZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGxpc3RJdGVtV2l0aG91dFNwYWNlc1JlLnRlc3QobGluZSk7XG4gIH1cbn1cbiIsImV4cG9ydCB0eXBlIFZlcnRpY2FsTGluZXNBY3Rpb24gPSBcIm5vbmVcIiB8IFwiem9vbS1pblwiIHwgXCJ0b2dnbGUtZm9sZGluZ1wiO1xuZXhwb3J0IHR5cGUgS2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgPVxuICB8IFwibmV2ZXJcIlxuICB8IFwiYnVsbGV0LW9ubHlcIlxuICB8IFwiYnVsbGV0LWFuZC1jaGVja2JveFwiO1xuXG5pbnRlcmZhY2UgU2V0dGluZ3NPYmplY3Qge1xuICBzdHlsZUxpc3RzOiBib29sZWFuO1xuICBkZWJ1ZzogYm9vbGVhbjtcbiAgc3RpY2tDdXJzb3I6IEtlZXBDdXJzb3JXaXRoaW5Db250ZW50IHwgYm9vbGVhbjtcbiAgYmV0dGVyRW50ZXI6IGJvb2xlYW47XG4gIGJldHRlclRhYjogYm9vbGVhbjtcbiAgc2VsZWN0QWxsOiBib29sZWFuO1xuICBsaXN0TGluZXM6IGJvb2xlYW47XG4gIGxpc3RMaW5lQWN0aW9uOiBWZXJ0aWNhbExpbmVzQWN0aW9uO1xuICBkbmRFeHBlcmltZW50OiBib29sZWFuO1xuICBwcmV2aW91c1JlbGVhc2U6IHN0cmluZyB8IG51bGw7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNldHRpbmdzT2JqZWN0ID0ge1xuICBzdHlsZUxpc3RzOiB0cnVlLFxuICBkZWJ1ZzogZmFsc2UsXG4gIHN0aWNrQ3Vyc29yOiBcImJ1bGxldC1hbmQtY2hlY2tib3hcIixcbiAgYmV0dGVyRW50ZXI6IHRydWUsXG4gIGJldHRlclRhYjogdHJ1ZSxcbiAgc2VsZWN0QWxsOiB0cnVlLFxuICBsaXN0TGluZXM6IGZhbHNlLFxuICBsaXN0TGluZUFjdGlvbjogXCJ0b2dnbGUtZm9sZGluZ1wiLFxuICBkbmRFeHBlcmltZW50OiBmYWxzZSxcbiAgcHJldmlvdXNSZWxlYXNlOiBudWxsLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlIHtcbiAgbG9hZERhdGEoKTogUHJvbWlzZTxTZXR0aW5nc09iamVjdD47XG4gIHNhdmVEYXRhKHNldHRpbmdzOiBTZXR0aW5nc09iamVjdCk6IFByb21pc2U8dm9pZD47XG59XG5cbnR5cGUgQ2FsbGJhY2sgPSAoKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3Mge1xuICBwcml2YXRlIHN0b3JhZ2U6IFN0b3JhZ2U7XG4gIHByaXZhdGUgdmFsdWVzOiBTZXR0aW5nc09iamVjdDtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFNldDxDYWxsYmFjaz47XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogU3RvcmFnZSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBnZXQga2VlcEN1cnNvcldpdGhpbkNvbnRlbnQoKSB7XG4gICAgLy8gQWRhcHRvciBmb3IgdXNlcnMgbWlncmF0aW5nIGZyb20gb2xkZXIgdmVyc2lvbiBvZiB0aGUgcGx1Z2luLlxuICAgIGlmICh0aGlzLnZhbHVlcy5zdGlja0N1cnNvciA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIFwiYnVsbGV0LWFuZC1jaGVja2JveFwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy52YWx1ZXMuc3RpY2tDdXJzb3IgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gXCJuZXZlclwiO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnZhbHVlcy5zdGlja0N1cnNvcjtcbiAgfVxuXG4gIHNldCBrZWVwQ3Vyc29yV2l0aGluQ29udGVudCh2YWx1ZTogS2VlcEN1cnNvcldpdGhpbkNvbnRlbnQpIHtcbiAgICB0aGlzLnNldChcInN0aWNrQ3Vyc29yXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBvdmVycmlkZVRhYkJlaGF2aW91cigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMuYmV0dGVyVGFiO1xuICB9XG5cbiAgc2V0IG92ZXJyaWRlVGFiQmVoYXZpb3VyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJiZXR0ZXJUYWJcIiwgdmFsdWUpO1xuICB9XG5cbiAgZ2V0IG92ZXJyaWRlRW50ZXJCZWhhdmlvdXIoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmJldHRlckVudGVyO1xuICB9XG5cbiAgc2V0IG92ZXJyaWRlRW50ZXJCZWhhdmlvdXIodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNldChcImJldHRlckVudGVyXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBvdmVycmlkZVNlbGVjdEFsbEJlaGF2aW91cigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMuc2VsZWN0QWxsO1xuICB9XG5cbiAgc2V0IG92ZXJyaWRlU2VsZWN0QWxsQmVoYXZpb3VyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJzZWxlY3RBbGxcIiwgdmFsdWUpO1xuICB9XG5cbiAgZ2V0IGJldHRlckxpc3RzU3R5bGVzKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5zdHlsZUxpc3RzO1xuICB9XG5cbiAgc2V0IGJldHRlckxpc3RzU3R5bGVzKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJzdHlsZUxpc3RzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCB2ZXJ0aWNhbExpbmVzKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5saXN0TGluZXM7XG4gIH1cblxuICBzZXQgdmVydGljYWxMaW5lcyh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2V0KFwibGlzdExpbmVzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCB2ZXJ0aWNhbExpbmVzQWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5saXN0TGluZUFjdGlvbjtcbiAgfVxuXG4gIHNldCB2ZXJ0aWNhbExpbmVzQWN0aW9uKHZhbHVlOiBWZXJ0aWNhbExpbmVzQWN0aW9uKSB7XG4gICAgdGhpcy5zZXQoXCJsaXN0TGluZUFjdGlvblwiLCB2YWx1ZSk7XG4gIH1cblxuICBnZXQgZHJhZ0FuZERyb3AoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmRuZEV4cGVyaW1lbnQ7XG4gIH1cblxuICBzZXQgZHJhZ0FuZERyb3AodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNldChcImRuZEV4cGVyaW1lbnRcIiwgdmFsdWUpO1xuICB9XG5cbiAgZ2V0IGRlYnVnKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5kZWJ1ZztcbiAgfVxuXG4gIHNldCBkZWJ1Zyh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2V0KFwiZGVidWdcIiwgdmFsdWUpO1xuICB9XG5cbiAgZ2V0IHByZXZpb3VzUmVsZWFzZSgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMucHJldmlvdXNSZWxlYXNlO1xuICB9XG5cbiAgc2V0IHByZXZpb3VzUmVsZWFzZSh2YWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICAgIHRoaXMuc2V0KFwicHJldmlvdXNSZWxlYXNlXCIsIHZhbHVlKTtcbiAgfVxuXG4gIG9uQ2hhbmdlKGNiOiBDYWxsYmFjaykge1xuICAgIHRoaXMuY2FsbGJhY2tzLmFkZChjYik7XG4gIH1cblxuICByZW1vdmVDYWxsYmFjayhjYjogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5kZWxldGUoY2IpO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoREVGQVVMVF9TRVRUSU5HUykpIHtcbiAgICAgIHRoaXMuc2V0KGsgYXMga2V5b2YgU2V0dGluZ3NPYmplY3QsIHYpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy52YWx1ZXMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICBERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgYXdhaXQgdGhpcy5zdG9yYWdlLmxvYWREYXRhKClcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICBhd2FpdCB0aGlzLnN0b3JhZ2Uuc2F2ZURhdGEodGhpcy52YWx1ZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXQ8VCBleHRlbmRzIGtleW9mIFNldHRpbmdzT2JqZWN0PihcbiAgICBrZXk6IFQsXG4gICAgdmFsdWU6IFNldHRpbmdzT2JqZWN0W1RdXG4gICk6IHZvaWQge1xuICAgIHRoaXMudmFsdWVzW2tleV0gPSB2YWx1ZTtcblxuICAgIGZvciAoY29uc3QgY2Igb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgQXJyb3dMZWZ0QW5kQ3RybEFycm93TGVmdEJlaGF2aW91ck92ZXJyaWRlIH0gZnJvbSBcIi4vZmVhdHVyZXMvQXJyb3dMZWZ0QW5kQ3RybEFycm93TGVmdEJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBCYWNrc3BhY2VCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL0JhY2tzcGFjZUJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBCZXR0ZXJMaXN0c1N0eWxlcyB9IGZyb20gXCIuL2ZlYXR1cmVzL0JldHRlckxpc3RzU3R5bGVzXCI7XG5pbXBvcnQgeyBDdHJsQUFuZENtZEFCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL0N0cmxBQW5kQ21kQUJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBEZWxldGVCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL0RlbGV0ZUJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBEcmFnQW5kRHJvcCB9IGZyb20gXCIuL2ZlYXR1cmVzL0RyYWdBbmREcm9wXCI7XG5pbXBvcnQgeyBFZGl0b3JTZWxlY3Rpb25zQmVoYXZpb3VyT3ZlcnJpZGUgfSBmcm9tIFwiLi9mZWF0dXJlcy9FZGl0b3JTZWxlY3Rpb25zQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbmltcG9ydCB7IEVudGVyQmVoYXZpb3VyT3ZlcnJpZGUgfSBmcm9tIFwiLi9mZWF0dXJlcy9FbnRlckJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vZmVhdHVyZXMvRmVhdHVyZVwiO1xuaW1wb3J0IHsgTGlzdHNGb2xkaW5nQ29tbWFuZHMgfSBmcm9tIFwiLi9mZWF0dXJlcy9MaXN0c0ZvbGRpbmdDb21tYW5kc1wiO1xuaW1wb3J0IHsgTGlzdHNNb3ZlbWVudENvbW1hbmRzIH0gZnJvbSBcIi4vZmVhdHVyZXMvTGlzdHNNb3ZlbWVudENvbW1hbmRzXCI7XG5pbXBvcnQgeyBNZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUgfSBmcm9tIFwiLi9mZWF0dXJlcy9NZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbmltcG9ydCB7IFJlbGVhc2VOb3Rlc0Fubm91bmNlbWVudCB9IGZyb20gXCIuL2ZlYXR1cmVzL1JlbGVhc2VOb3Rlc0Fubm91bmNlbWVudFwiO1xuaW1wb3J0IHsgU2V0dGluZ3NUYWIgfSBmcm9tIFwiLi9mZWF0dXJlcy9TZXR0aW5nc1RhYlwiO1xuaW1wb3J0IHsgU2hpZnRUYWJCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL1NoaWZ0VGFiQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbmltcG9ydCB7IFRhYkJlaGF2aW91ck92ZXJyaWRlIH0gZnJvbSBcIi4vZmVhdHVyZXMvVGFiQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbmltcG9ydCB7IFZlcnRpY2FsTGluZXMgfSBmcm9tIFwiLi9mZWF0dXJlcy9WZXJ0aWNhbExpbmVzXCI7XG5pbXBvcnQgeyBDaGFuZ2VzQXBwbGljYXRvciB9IGZyb20gXCIuL3NlcnZpY2VzL0NoYW5nZXNBcHBsaWNhdG9yXCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9zZXJ2aWNlcy9Mb2dnZXJcIjtcbmltcG9ydCB7IE9ic2lkaWFuU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuL3NlcnZpY2VzL1BhcnNlclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGNvbnN0IFBMVUdJTl9WRVJTSU9OOiBzdHJpbmc7XG4gIGNvbnN0IENIQU5HRUxPR19NRDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbk91dGxpbmVyUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgcHJpdmF0ZSBmZWF0dXJlczogRmVhdHVyZVtdO1xuICBwcm90ZWN0ZWQgc2V0dGluZ3M6IFNldHRpbmdzO1xuICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xuICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3M7XG4gIHByaXZhdGUgcGFyc2VyOiBQYXJzZXI7XG4gIHByaXZhdGUgY2hhbmdlc0FwcGxpY2F0b3I6IENoYW5nZXNBcHBsaWNhdG9yO1xuICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyO1xuICBwcml2YXRlIGltZURldGVjdG9yOiBJTUVEZXRlY3RvcjtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coYExvYWRpbmcgb2JzaWRpYW4tb3V0bGluZXJgKTtcblxuICAgIGF3YWl0IHRoaXMucHJlcGFyZVNldHRpbmdzKCk7XG5cbiAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MgPSBuZXcgT2JzaWRpYW5TZXR0aW5ncyh0aGlzLmFwcCk7XG4gICAgdGhpcy5sb2dnZXIgPSBuZXcgTG9nZ2VyKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMucGFyc2VyID0gbmV3IFBhcnNlcih0aGlzLmxvZ2dlciwgdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5jaGFuZ2VzQXBwbGljYXRvciA9IG5ldyBDaGFuZ2VzQXBwbGljYXRvcigpO1xuICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyID0gbmV3IE9wZXJhdGlvblBlcmZvcm1lcihcbiAgICAgIHRoaXMucGFyc2VyLFxuICAgICAgdGhpcy5jaGFuZ2VzQXBwbGljYXRvclxuICAgICk7XG5cbiAgICB0aGlzLmltZURldGVjdG9yID0gbmV3IElNRURldGVjdG9yKCk7XG4gICAgYXdhaXQgdGhpcy5pbWVEZXRlY3Rvci5sb2FkKCk7XG5cbiAgICB0aGlzLmZlYXR1cmVzID0gW1xuICAgICAgLy8gc2VydmljZSBmZWF0dXJlc1xuICAgICAgbmV3IFJlbGVhc2VOb3Rlc0Fubm91bmNlbWVudCh0aGlzLCB0aGlzLnNldHRpbmdzKSxcbiAgICAgIG5ldyBTZXR0aW5nc1RhYih0aGlzLCB0aGlzLnNldHRpbmdzKSxcblxuICAgICAgLy8gZ2VuZXJhbCBmZWF0dXJlc1xuICAgICAgbmV3IExpc3RzTW92ZW1lbnRDb21tYW5kcyhcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5vYnNpZGlhblNldHRpbmdzLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lclxuICAgICAgKSxcbiAgICAgIG5ldyBMaXN0c0ZvbGRpbmdDb21tYW5kcyh0aGlzLCB0aGlzLm9ic2lkaWFuU2V0dGluZ3MpLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5rZWVwQ3Vyc29yV2l0aGluQ29udGVudFxuICAgICAgbmV3IEVkaXRvclNlbGVjdGlvbnNCZWhhdmlvdXJPdmVycmlkZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgdGhpcy5wYXJzZXIsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyXG4gICAgICApLFxuICAgICAgbmV3IEFycm93TGVmdEFuZEN0cmxBcnJvd0xlZnRCZWhhdmlvdXJPdmVycmlkZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgdGhpcy5pbWVEZXRlY3RvcixcbiAgICAgICAgdGhpcy5vcGVyYXRpb25QZXJmb3JtZXJcbiAgICAgICksXG4gICAgICBuZXcgQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMuaW1lRGV0ZWN0b3IsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyXG4gICAgICApLFxuICAgICAgbmV3IE1ldGFCYWNrc3BhY2VCZWhhdmlvdXJPdmVycmlkZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgdGhpcy5pbWVEZXRlY3RvcixcbiAgICAgICAgdGhpcy5vcGVyYXRpb25QZXJmb3JtZXJcbiAgICAgICksXG4gICAgICBuZXcgRGVsZXRlQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMuaW1lRGV0ZWN0b3IsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5vdmVycmlkZVRhYkJlaGF2aW91clxuICAgICAgbmV3IFRhYkJlaGF2aW91ck92ZXJyaWRlKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLmltZURldGVjdG9yLFxuICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyXG4gICAgICApLFxuICAgICAgbmV3IFNoaWZ0VGFiQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuaW1lRGV0ZWN0b3IsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5vdmVycmlkZUVudGVyQmVoYXZpb3VyXG4gICAgICBuZXcgRW50ZXJCZWhhdmlvdXJPdmVycmlkZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgdGhpcy5pbWVEZXRlY3RvcixcbiAgICAgICAgdGhpcy5vYnNpZGlhblNldHRpbmdzLFxuICAgICAgICB0aGlzLnBhcnNlcixcbiAgICAgICAgdGhpcy5vcGVyYXRpb25QZXJmb3JtZXJcbiAgICAgICksXG5cbiAgICAgIC8vIGZlYXR1cmVzIGJhc2VkIG9uIHNldHRpbmdzLm92ZXJyaWRlU2VsZWN0QWxsQmVoYXZpb3VyXG4gICAgICBuZXcgQ3RybEFBbmRDbWRBQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMuaW1lRGV0ZWN0b3IsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5iZXR0ZXJMaXN0c1N0eWxlc1xuICAgICAgbmV3IEJldHRlckxpc3RzU3R5bGVzKHRoaXMuc2V0dGluZ3MsIHRoaXMub2JzaWRpYW5TZXR0aW5ncyksXG5cbiAgICAgIC8vIGZlYXR1cmVzIGJhc2VkIG9uIHNldHRpbmdzLnZlcnRpY2FsTGluZXNcbiAgICAgIG5ldyBWZXJ0aWNhbExpbmVzKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgIHRoaXMucGFyc2VyXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5kcmFnQW5kRHJvcFxuICAgICAgbmV3IERyYWdBbmREcm9wKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgIHRoaXMucGFyc2VyLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lclxuICAgICAgKSxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIHRoaXMuZmVhdHVyZXMpIHtcbiAgICAgIGF3YWl0IGZlYXR1cmUubG9hZCgpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG9udW5sb2FkKCkge1xuICAgIGNvbnNvbGUubG9nKGBVbmxvYWRpbmcgb2JzaWRpYW4tb3V0bGluZXJgKTtcblxuICAgIGF3YWl0IHRoaXMuaW1lRGV0ZWN0b3IudW5sb2FkKCk7XG5cbiAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgdGhpcy5mZWF0dXJlcykge1xuICAgICAgYXdhaXQgZmVhdHVyZS51bmxvYWQoKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcHJlcGFyZVNldHRpbmdzKCkge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3ModGhpcyk7XG4gICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5sb2FkKCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJlZGl0b3JJbmZvRmllbGQiLCJmb2xkZWRSYW5nZXMiLCJmb2xkYWJsZSIsImZvbGRFZmZlY3QiLCJ1bmZvbGRFZmZlY3QiLCJydW5TY29wZUhhbmRsZXJzIiwia2V5bWFwIiwiTm90aWNlIiwiU3RhdGVFZmZlY3QiLCJEZWNvcmF0aW9uIiwiU3RhdGVGaWVsZCIsIkVkaXRvclZpZXciLCJQbGF0Zm9ybSIsIkVkaXRvclN0YXRlIiwiUHJlYyIsIk1vZGFsIiwiTWFya2Rvd25SZW5kZXJlciIsIlBsdWdpblNldHRpbmdUYWIiLCJTZXR0aW5nIiwiVmlld1BsdWdpbiIsIlBsdWdpbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFvR0E7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ3RILFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUMs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
