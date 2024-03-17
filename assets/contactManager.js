const MAX_CARDS_PER_ROW = 3;

let cardsNode = null;
let totalContactsNode = null;

let totalContacts = 0;

let url = "https://raw.githubusercontent.com/gtrevize/dummyData/main/mock_data.json";
let persons = [];
let fieldNames = ["id", "first_name", "last_name", "company", "department", "job_title", "date_of_birth", "email", "phone"];
let elementIds = {
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

function loadCommonSections() {
    loadSection("sct-header", "assets/header.html");
    loadSection("sct-footer", "assets/footer.html");
}

function loadSection(elementId, filePath) {
    fetch(filePath).then(function(response) {
        return response.text();
    }).then(function(htmlResponse) {
        document.getElementById(elementId).innerHTML = htmlResponse;
    }).catch(function(err) {
        console.warn('Error loading the section:', err);
    });
}

function fetchContacts() {
    let data = localStorage.getItem("persons");
    // console.log("data", data);
    if (data == null) {
        console.log("Fetching contacts from ", url);
        fetch(url)
        .then((htmlResponse) => htmlResponse.text())
        .then((jsonText) => {
            persons = JSON.parse(jsonText);
            localStorage.setItem("persons", jsonText)
            console.log(localStorage.getItem("persons"));
        })
        .catch((htmlError) => {
            console.log('Error loading persons from ', url, htmlError);
            alert('Error loading persons from ' + url + ' ' + htmlError);
        });
    }
    else {
        persons = JSON.parse(data);
        // console.log("Read contacts from local storage", persons);
    }
    updateTotalContacts(persons);
    // console.log('totalContactsNode', totalContactsNode);
    // console.log('Total contacts', totalContacts);
}

function populateCards() {
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

function populateList(tableElementId, data) {
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
            <button id="btn-delete-{{id}}" type="button" class="bnt btn-danger border-0"><i class="fas fa-trash text-danger" onclick="deleteContact(this, {{id}})"></i></button>
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

function clearList(tableElementId) {
    let listNode = document.querySelector("#" + tableElementId + " tbody");
    listNode.innerHTML = "";
}

function searchContacts(event) {
    event.preventDefault();
    // console.log("event", event);

    let found = persons.filter((person) => {
        for (let fieldName of fieldNames) {
            let element = event.target.elements[elementIds[fieldName]];
            if (element == null || !element.value) {
                continue;
            }
            
            let value = String(element.value)
            if (value.toLowerCase() != person[fieldName].toLowerCase()) {
                return false;
            }
        }

        return true;
    });

    console.log("found", found);
    populateList("tbl-contacts", found);
}

function deleteContact(element, contactId) {
    console.log("Delete", contactId);
    alert("Trying to Delete " + contactId);
    persons.splice((contactId - 1), 1);
    updateTotalContacts(persons);
    localStorage.setItem("persons", JSON.stringify(persons));
    clearList("tbl-contacts");
    populateList("tbl-contacts", persons);
}

function updateTotalContacts(data) {
    totalContactsNode = document.getElementById("txtTotalContacts");
    totalContacts = persons.length;
    totalContactsNode.innerHTML = totalContacts.toString();
}