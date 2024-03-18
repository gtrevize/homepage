const EXTERNAL_HTML = {
    "sct-header": "assets/header.html",
    "sct-footer": "assets/footer.html",
    "sct-table": "assets/table.html",
    "sct-form": "assets/form.html",
};

const LOCAL_STORAGE_KEY = "persons";
const DUMMY_DATA_URL = "https://raw.githubusercontent.com/gtrevize/dummyData/main/mock_data.json";
const MAX_CARDS_PER_ROW = 3;
const FIELD_NAMES = ["id", "first_name", "last_name", "company", "department", "job_title", "date_of_birth", "email", "phone"];
const ELEMENT_IDS = {
    id: null,
    first_name: "txtFirstName",
    last_name: "txtLastName",
    company: "txtCompany",
    department: "txtDepartment",
    job_title: "txtJobTitle",
    date_of_birth: "txtDateOfBirth",
    email: "txtEmail",
    phone: "txtPhone"
}

let cardsNode = null;
let totalContactsNode = null;

let totalContacts = 0;

let persons = [];

async function loadCommonSections(externalHTMl) {
    for (const key of Object.keys(externalHTMl)) {
        let targetNode = document.getElementById(key);
        if (!targetNode) {
            continue;
        }
        await loadSection(key, externalHTMl[key]);
    }
}

async function loadSection(elementId, filePath) {
    try {
        const htmlResponse = await fetch(filePath);
        const textResponse = await htmlResponse.text();
        document.getElementById(elementId).innerHTML = textResponse;
        console.log("Section", elementId, "loaded from", filePath);
        
        // Force DOM to refresh after loading a section from file
        // document.getElementById(elementId).style.display = 'none';
        // document.getElementById(elementId).style.display = 'block';
    } catch (htmlError) {
        // Log any errors that occur during fetch or processing
        console.log('Error loading the section from', filePath, 'into', elementId, htmlError);
    }
}

function markLinkActive(elementId) {
    let nodes = document.querySelectorAll(".nav-item.active");
    for (const node of nodes) {
        node.classList.remove("active");
    }
    let currentPageNode = document.getElementById(elementId);
    currentPageNode.classList.add("active");    
}

/* EVENT HANDLERS */
function onClickDelete(event, rowId) {
    event.preventDefault();
    deleteDataRow(persons, rowId);
    persistList(LOCAL_STORAGE_KEY, persons);
    refreshList("tbl-contacts", persons, FIELD_NAMES);
    updateTotalRows("txtTotalContacts", persons);
}

function onClickSearch(event) {
    event.preventDefault();
    let found = searchData(event, persons, FIELD_NAMES, ELEMENT_IDS);
    refreshList("tbl-contacts", found, FIELD_NAMES);
    updateTotalRows("txtTotalContacts", found);
}

function onClickClearAll(event) {
    event.preventDefault();
    clearForm("frm-contact");
    clearList("tbl-contacts");
    updateTotalRows("txtTotalContacts", []);
}

function onClickClearForm(event) {
    event.preventDefault();
    clearForm("frm-contact");
    updateTotalRows("txtTotalContacts", []);
}

function onClickAdd(event) {
    event.preventDefault();
    addDataRow(event.target, persons);
}

function onClickReset(event) {
    event.preventDefault();
    alert("About to delete all local data");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log("Local storage deleted");
}

function clearForm(elementId) {
    let form = document.getElementById(elementId);
    form.reset();
    for (const fieldName of FIELD_NAMES) {
        let element = document.getElementById(ELEMENT_IDS[fieldName]);
        if (element) {
            element.value = "";
        }
    }
}

function populateCards(elementId, persons) {
    let cardsNode = document.getElementById(elementId);
    let cardRowTemplate = document.getElementById("tplCardRow");
    let cardTemplate = document.getElementById("tplCard");
    let i = 0;
    let r = 0;
    let newRowNode = null;
    let newRowId = null;

    for (let person of persons) {
        if (i % MAX_CARDS_PER_ROW == 0) {
            // create new row
            if (newRowNode != null) {
                cardsNode.append(newRowNode);
            }
            newRowNode = cardRowTemplate.content.cloneNode(true);
            newRowId = 'row-cards-' + (r + 1);
            newRowNode.id = newRowId;
            // console.log('Created row', r + 1, newRowNode);
            r++;
        }

        // create and fill new card
        let newCardNode = cardTemplate.content.cloneNode(true);
        newCardNode.id = 'crd-person-' + (i + 1);
        newCardNode.querySelector('.contact-name').innerHTML = person.last_name + ', ' + person.first_name;
        newCardNode.querySelector('.contact-phone').innerHTML = person.phone;
        newCardNode.querySelector('.contact-email').innerHTML = person.email;
        newCardNode.querySelector('img').src = "https://i.pravatar.cc/256?img=" + (i + 1);
        // newCardNode.querySelector('img').src = person.image;
        
        newRowNode.children[0].append(newCardNode);
        // console.log('Created card', i + 1, newCardNode);
        i++;
    }
}

function populateList(tableElementId, data, fieldNames) {
    let listNode = document.querySelector("#" + tableElementId + " tbody");
    let newRowNode = null;
    let newTdNode = null;
    let i = 0;
    for (let person of data) {

        // create new row
        newRowNode = document.createElement("tr");
        newRowNode.id = 'row-person-' + (i + 1);

        // create new cells and add them to the row
        newTdNode = document.createElement("td")
        let buttonHtml = `
            <button id="btn-delete-{{id}}" type="button" class="bnt btn-danger border-0"><i class="fas fa-trash text-danger" onclick="onClickDelete(this, {{id}})"></i></button>
        `;
        newTdNode.innerHTML = buttonHtml.replaceAll("{{id}}", (i + 1));
        newRowNode.append(newTdNode);

        for (let fieldName of fieldNames) {
            // console.log(fieldName);
            newTdNode = document.createElement("td")
            newTdNode.innerHTML = person[fieldName];
            newRowNode.append(newTdNode);
        }

        // newRowNode.querySelector('img').src = "https://i.pravatar.cc/256?img=" + (i + 1);
        // newRowNode.querySelector('img').src = person.image;
        
        listNode.append(newRowNode);
        // console.log('Created Row', i + 1, newRowNode);
        i++;
    }
}

async function fetchData(itemId, url) {
    console.log("Fetching data");
    let dataJson = localStorage.getItem(itemId);
    let dataArray = null;
    // console.log("dataJson", dataJson);
    if (dataJson == null) {
        console.log("Fetching data from ", url);
        try {
            const htmlResponse = await fetch(url);
            const textResponse = await htmlResponse.text();            
            dataArray = JSON.parse(textResponse);
            // console.log("Read data from url", url, dataArray);
            persistList(itemId, dataArray);
        }
        catch(htmlError) {
            console.log('Error loading dataArray from ', url, htmlError);
            alert('Error loading dataArray from ' + url + ' ' + htmlError);
        };
    }
    else {
        dataArray = JSON.parse(dataJson);
        // console.log("Read contacts from local storage", dataArray);
    }

    return dataArray;
}

function clearList(tableElementId) {
    let listNode = document.querySelector("#" + tableElementId + " tbody");
    listNode.innerHTML = "";
}

function refreshList(tableElementId, data, fieldNames) {
    clearList(tableElementId);
    populateList(tableElementId, data, fieldNames);
}

function persistList(itemId, data) {
    localStorage.setItem(itemId, JSON.stringify(data));
}

function searchData(event, data, fieldNames, elementIds) {
    event.preventDefault();
    // console.log("event", event);

    let found = data.filter((row) => {
        for (let fieldName of fieldNames) {
            let element = event.target.elements[elementIds[fieldName]];
            if (element == null || !element.value) {
                continue;
            }
            
            let value = String(element.value)
            if (value.toLowerCase() != row[fieldName].toLowerCase()) {
                return false;
            }
        }

        return true;
    });

    return found;
}

function getMaxId(data, fieldName) {
    let maxId = 0;
    
    data.map((row) => {
        let id = parseInt(row[fieldName]);
        if (id > maxId) {
            maxId = id;
        }
    });
    
    return maxId;
}

function addDataRow(elementId, data) {
    let newRow = {};
    let id = getMaxId(data, "id") + 1;
    newRow.id = id;
    for (const fieldName of FIELD_NAMES) {
        let element = document.getElementById(ELEMENT_IDS[fieldName]);
        if (element) {
            newRow[fieldName] = element.value;
        }
    }

    data.push(newRow);
    persistList(LOCAL_STORAGE_KEY, data);
    console.log("Added row", id, newRow)
    alert("Data added");
}


function deleteDataRow(data, rowId) {
    console.log("Delete", rowId);
    alert("Trying to Delete " + rowId);
    data.splice((rowId - 1), 1);

    return data;
}

function updateTotalRows(elementId, data) {
    let totalContactsNode = document.getElementById(elementId);
    let totalContacts = data.length;
    totalContactsNode.innerHTML = totalContacts.toString();
}