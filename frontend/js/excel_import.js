var sheets = null;
var selectedSheetIndex = 0;
var selectedLineIndex = 0;
var xlf = null;
var drop = null;

var changeColumn = null;
var dataColumn = null;
var systemColumn = null;
var referenceColumn = null;
var processColumn = null;
var dataGroupColumn = null;
var exitColumn = null;
var enterColumn = null;
var readColumn = null;
var writeColumn = null;
var commentColumn = null;

function fixdata(data) {
    var o = "", l = 0, w = 10240;
    for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
    return o;
}

function ab2str(data) {
    var o = "", l = 0, w = 10240;
    for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint16Array(data.slice(l * w, l * w + w)));
    o += String.fromCharCode.apply(null, new Uint16Array(data.slice(l * w)));
    return o;
}

function s2ab(s) {
    var b = new ArrayBuffer(s.length * 2), v = new Uint16Array(b);
    for (var i = 0; i != s.length; ++i) v[i] = s.charCodeAt(i);
    return [v, b];
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files;
    processFile(files);
}

function processFile(files) {
    var f = files[0];
    {
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            var wb = XLSX.read(data, { type: 'binary' });
            sheets = getSheetData(wb);
            updateSheetOptions(sheets);
            selectSheet(-1);
            sheetDropdownEnabled(true);
          //  var html = function ConvertJsonToTable(sheets, tableId, tableClassName, linkText)
            setOutput(out, sheets);
        };
        reader.readAsBinaryString(f);
    }
}

function updateSheetOptions(sheets) {
    var sheetNames = new Array();
    for (var sheet in sheets) {
        sheetNames.push(sheets[sheet].name);
    }
    updateDropDownOptions(getSheetOptions(), sheetNames, selectSheet);
}

function selectSheet(sheetIndex) {
    if (selectedSheetIndex != sheetIndex) {
        selectedSheetIndex = sheetIndex;
        var sheetDropdown = getSheetDropdown();
        sheetDropdown.html("");
        if (selectedSheetIndex >= 0)
            sheetDropdown.append(sheets[sheetIndex].name);
        else
            sheetDropdown.append("Sélectionner une feuille");
        sheetDropdown.append("<span class=\"caret\"></span>");
        onSelectedSheetChanged();
    }
}

function onSelectedSheetChanged() {
    updateSheetOutput();
    updateLineOptions();
    // update the line
    selectLine(-1);
    lineDropdownEnabled(selectedSheetIndex >= 0);
}

function updateSheetOutput() {
    var sheet = null;
    if (selectedSheetIndex >= 0) {
    sheet = sheets[selectedSheetIndex];
   // var js = JSON.stringify(sheet, 2, 2);
   // var html = function ConvertJsonToTable(sheet, tableId, tableClassName, linkText)
    }
    setOutput(out_sheet, sheet);
}

function updateLineOptions() {
    var maxLines = 10;

    if (selectedSheetIndex >= 0) {
        var lineCount = 0;
        var selectedSheet = sheets[selectedSheetIndex];
        var lines = {};
        for (var lineIndex in selectedSheet.lines){
            lines[lineIndex] = lineIndex;
            if (++lineCount >= maxLines) break;
        }
        updateDropDownOptions(getLineOptions(), lines, selectLine);
    }
    else
    {
        getLineOptions().html("");
    }
}

function selectLine(lineIndex) {
    if (selectedLineIndex != lineIndex) {
        selectedLineIndex = lineIndex;
        var lineDropdown = getLineDropdown();
        lineDropdown.html("");
        if (selectedLineIndex >= 0)
            lineDropdown.append(selectedLineIndex);
        else
            lineDropdown.append("Sélectionner une ligne");
        lineDropdown.append("<span class=\"caret\"></span>");
        onSelectedLineChanged();
    }
}

function onSelectedLineChanged() {
    updateLineOutput();
    if (selectedLineIndex >= 0) {
        updateHeaderMappingDisplay();
        getMesureDetailsControl().show();
    }
    else {
        getMesureDetailsControl().hide();
    }
}

function updateLineOutput() {
    var line = null;
    if (selectedLineIndex >= 0) line = sheets[selectedSheetIndex].lines[selectedLineIndex];
    setOutput(out_line, line);
}

function updateHeaderMappingDisplay() {
    if (selectedLineIndex >= 0) {
        var selectedLine = sheets[selectedSheetIndex].lines[selectedLineIndex];
        updateDropDownOptions(getChangeOptions(), selectedLine, function(data) { setColumnValue(getChangeDropDown(), data, "Changements"); changeColumn = data; });
        updateDropDownOptions(getSystemOptions(), selectedLine, function(data) { setColumnValue(getSystemDropDown(), data, "Systeme"); systemColumn = data; });
        updateDropDownOptions(getReferenceOptions(), selectedLine, function(data) { setColumnValue(getReferenceDropDown(), data, "Reference"); referenceColumn = data; });
        updateDropDownOptions(getProcessOptions(), selectedLine, function(data) { setColumnValue(getProcessDropDown(), data, "Processus Fonctionnel"); processColumn = data; });
        updateDropDownOptions(getDataGroupOptions(), selectedLine, function(data) { setColumnValue(getDataGroupDropDown(), data, "Groupe de donnees"); dataGroupColumn = data; });
        updateDropDownOptions(getDataGroupOptions(), selectedLine, function(data) { setColumnValue(getMouveDropDown(), data, "Mouvement"); dataGroupColumn = data; });
        updateDropDownOptions(getEnterOptions(), selectedLine, function(data) { setColumnValue(getEnterDropDown(), data, "Entree"); enterColumn = data; enterColumn = data; });
        updateDropDownOptions(getExitOptions(), selectedLine, function(data) { setColumnValue(getExitDropDown(), data, "Sortie"); exitColumn = data; });
        updateDropDownOptions(getReadOptions(), selectedLine, function(data) { setColumnValue(getReadDropDown(), data, "Lecture"); readColumn = data; });
        updateDropDownOptions(getWriteOptions(), selectedLine, function(data) { setColumnValue(getWriteDropDown(), data, "Ecriture"); writeColumn = data; });

        updateDropDownOptions(getWriteOptions(), selectedLine, function(data) { setColumnValue(getRTotalDropDown(), data, "Total PFC"); writeColumn = data; });
        updateDropDownOptions(getWriteOptions(), selectedLine, function(data) { setColumnValue(getImpactDropDown(), data, "Impact"); writeColumn = data; });
        updateDropDownOptions(getWriteOptions(), selectedLine, function(data) { setColumnValue(getRTailleDropDown(), data, "Taille Pondere"); writeColumn = data; });

        updateDropDownOptions(getCommentOptions(), selectedLine, function(data) { setColumnValue(getCommentDropDown(), data, "Commentaire"); commentColumn = data; });
    }
}

function createMeasures() {
    var measures = new Array();
    var selectedSheet = sheets[selectedSheetIndex];

    for (var line in selectedSheet.lines) {
        if (line > selectedLineIndex) {
            var measure = new Object();
            measure.change = selectedSheet.lines[line][changeColumn];
            measure.system = selectedSheet.lines[line][systemColumn];
            measure.reference = selectedSheet.lines[line][referenceColumn];
            measure.process = selectedSheet.lines[line][processColumn];
            measure.dataGroup = selectedSheet.lines[line][dataGroupColumn];
            measure.enter = selectedSheet.lines[line][enterColumn];
            measure.exit = selectedSheet.lines[line][exitColumn];
            measure.read = selectedSheet.lines[line][readColumn];
            measure.write = selectedSheet.lines[line][writeColumn];
            measure.comment = selectedSheet.lines[line][commentColumn];
            measures.push(measure);
        }
    }
    var output = JSON.stringify(measures, 2, 2);
    if (out_measures.innerText === undefined) out_measures.textContent = output;
    else out_measures.innerText = output;
    //console.log(JSON.stringify(measures, 2, 2));
}

function setColumnValue(control, value, nullValue) {
    control.html("");
    if (value == null) {
        control.html(nullValue);
    }
    else {
        control.html(sheets[selectedSheetIndex].lines[selectedLineIndex][value]);
    }
    control.append("<span class=\"caret\"></span>");
}

// The data is the option index, the displayed value is the value of the index.
// Don't forget you can use associative arrays if needed.
function updateDropDownOptions(control, options, onClick) {
    control.html("");
    for (var option in options) {
        var opt = $("<li></li>");
        var ref = $("<a href='#' data-value='" + option + "'>" + options[option] + "</a>");
        ref.click(function(e) { e.preventDefault(); var value = $(e.target); var data = value.attr("data-value"); onClick(data) });
        opt.append(ref);
        control.append(opt);
    }
}

function handleDragover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleFile(e) {
    var files = e.target.files;
    processFile(files);
}
//**************************************************
/**
 * JavaScript format string function
 *
 */
String.prototype.format = function()
{
  var args = arguments;

  return this.replace(/{(\d+)}/g, function(match, number)
  {
    return typeof args[number] != 'undefined' ? args[number] :
                                                '{' + number + '}';
  });
};


/**
 * Convert a Javascript Oject array or String array to an HTML table
 * JSON parsing has to be made before function call
 * It allows use of other JSON parsing methods like jQuery.parseJSON
 * http(s)://, ftp://, file:// and javascript:; links are automatically computed
 *
 * JSON data samples that should be parsed and then can be converted to an HTML table
 *     var objectArray = '[{"Total":"34","Version":"1.0.4","Office":"New York"},{"Total":"67","Version":"1.1.0","Office":"Paris"}]';
 *     var stringArray = '["New York","Berlin","Paris","Marrakech","Moscow"]';
 *     var nestedTable = '[{ key1: "val1", key2: "val2", key3: { tableId: "tblIdNested1", tableClassName: "clsNested", linkText: "Download", data: [{ subkey1: "subval1", subkey2: "subval2", subkey3: "subval3" }] } }]';
 *
 * Code sample to create a HTML table Javascript String
 *     var jsonHtmlTable = ConvertJsonToTable(eval(dataString), 'jsonTable', null, 'Download');
 *
 * Code sample explaned
 *  - eval is used to parse a JSON dataString
 *  - table HTML id attribute will be 'jsonTable'
 *  - table HTML class attribute will not be added
 *  - 'Download' text will be displayed instead of the link itself
 *
 * @class ConvertJsonToTable
 *
 * @method ConvertJsonToTable
 *
 * @param parsedJson object Parsed JSON data
 * @param tableId string Optional table id
 * @param tableClassName string Optional table css class name
 * @param linkText string Optional text replacement for link pattern
 *
 * @return string Converted JSON to HTML table
 */
function ConvertJsonToTable(parsedJson, tableId, tableClassName, linkText)
{
    //Patterns for links and NULL value
    var italic = '<i>{0}</i>';
    var link = linkText ? '<a href="{0}">' + linkText + '</a>' :
                          '<a href="{0}">{0}</a>';

    //Pattern for table
    var idMarkup = tableId ? ' id="' + tableId + '"' :
                             '';

    var classMarkup = tableClassName ? ' class="' + tableClassName + '"' :
                                       '';

    var tbl = '<table border="1" cellpadding="1" cellspacing="1"' + idMarkup + classMarkup + '>{0}{1}</table>';

    //Patterns for table content
    var th = '<thead>{0}</thead>';
    var tb = '<tbody>{0}</tbody>';
    var tr = '<tr>{0}</tr>';
    var thRow = '<th>{0}</th>';
    var tdRow = '<td>{0}</td>';
    var thCon = '';
    var tbCon = '';
    var trCon = '';

    if (parsedJson)
    {
        var isStringArray = typeof(parsedJson[0]) == 'string';
        var headers;

        // Create table headers from JSON data
        // If JSON data is a simple string array we create a single table header
        if(isStringArray)
            thCon += thRow.format('value');
        else
        {
            // If JSON data is an object array, headers are automatically computed
            if(typeof(parsedJson[0]) == 'object')
            {
                headers = array_keys(parsedJson[0]);

                for (i = 0; i < headers.length; i++)
                    thCon += thRow.format(headers[i]);
            }
        }
        th = th.format(tr.format(thCon));

        // Create table rows from Json data
        if(isStringArray)
        {
            for (i = 0; i < parsedJson.length; i++)
            {
                tbCon += tdRow.format(parsedJson[i]);
                trCon += tr.format(tbCon);
                tbCon = '';
            }
        }
        else
        {
            if(headers)
            {
                var urlRegExp = new RegExp(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);
                var javascriptRegExp = new RegExp(/(^javascript:[\s\S]*;$)/ig);

                for (i = 0; i < parsedJson.length; i++)
                {
                    for (j = 0; j < headers.length; j++)
                    {
                        var value = parsedJson[i][headers[j]];
                        var isUrl = urlRegExp.test(value) || javascriptRegExp.test(value);

                        if(isUrl)   // If value is URL we auto-create a link
                            tbCon += tdRow.format(link.format(value));
                        else
                        {
                            if(value){
                            	if(typeof(value) == 'object'){
                            		//for supporting nested tables
                            		tbCon += tdRow.format(ConvertJsonToTable(eval(value.data), value.tableId, value.tableClassName, value.linkText));
                            	} else {
                            		tbCon += tdRow.format(value);
                            	}

                            } else {    // If value == null we format it like PhpMyAdmin NULL values
                                tbCon += tdRow.format(italic.format(value).toUpperCase());
                            }
                        }
                    }
                    trCon += tr.format(tbCon);
                    tbCon = '';
                }
            }
        }
        tb = tb.format(trCon);
        tbl = tbl.format(th, tb);

        return tbl;
    }
    return null;
}



function array_keys(input, search_value, argStrict)
{
    var search = typeof search_value !== 'undefined', tmp_arr = [], strict = !!argStrict, include = true, key = '';

    if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
        return input.keys(search_value, argStrict);
    }

    for (key in input)
    {
        if (input.hasOwnProperty(key))
        {
            include = true;
            if (search)
            {
                if (strict && input[key] !== search_value)
                    include = false;
                else if (input[key] != search_value)
                    include = false;
            }
            if (include)
                tmp_arr[tmp_arr.length] = key;
        }
    }
    return tmp_arr;
}
