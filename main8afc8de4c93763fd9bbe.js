(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["RotationMaster"] = factory();
	else
		root["RotationMaster"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/a1sauce.ts":
/*!************************!*\
  !*** ./src/a1sauce.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createButton: () => (/* binding */ createButton),
/* harmony export */   createCheckboxSetting: () => (/* binding */ createCheckboxSetting),
/* harmony export */   createDropdownSetting: () => (/* binding */ createDropdownSetting),
/* harmony export */   createHeading: () => (/* binding */ createHeading),
/* harmony export */   createNumberSetting: () => (/* binding */ createNumberSetting),
/* harmony export */   createProfileManager: () => (/* binding */ createProfileManager),
/* harmony export */   createRangeSetting: () => (/* binding */ createRangeSetting),
/* harmony export */   createSeperator: () => (/* binding */ createSeperator),
/* harmony export */   createSmallText: () => (/* binding */ createSmallText),
/* harmony export */   createText: () => (/* binding */ createText),
/* harmony export */   createTextSetting: () => (/* binding */ createTextSetting),
/* harmony export */   getSetting: () => (/* binding */ getSetting),
/* harmony export */   loadSettings: () => (/* binding */ loadSettings),
/* harmony export */   setDefaultSettings: () => (/* binding */ setDefaultSettings),
/* harmony export */   settingsExist: () => (/* binding */ settingsExist),
/* harmony export */   timeout: () => (/* binding */ timeout),
/* harmony export */   updateSetting: () => (/* binding */ updateSetting)
/* harmony export */ });
var config = __webpack_require__(/*! ./appconfig.json */ "./src/appconfig.json");
var appName = config.appName;
function createHeading(size, content) {
    let header = document.createElement(size);
    header.innerHTML = content;
    return header;
}
function createText(content) {
    let text = document.createElement('p');
    text.innerHTML = content;
    return text;
}
function createSmallText(content) {
    let text = document.createElement('small');
    text.innerHTML = content;
    return text;
}
function createSeperator() {
    return document.createElement('hr');
}
function createButton(content, fn, options) {
    let { classes = options.classes } = options;
    const button = document.createElement('button');
    button.innerHTML = content;
    if (options.classes.length) {
        for (let i = options.classes.length; i--; i >= 0) {
            button.classList.add(options.classes[i]);
        }
    }
    button.addEventListener('click', () => {
        fn();
    });
    return button;
}
function createDropdownSetting(name, description, defaultValue, options) {
    let select = createDropdown(name, defaultValue, options);
    let label = createLabel(name, description);
    let container = createFlexContainer('reverse-setting');
    container.appendChild(select);
    container.appendChild(label);
    return container;
}
function createTextSetting(name, description, defaultValue) {
    let input = createInput('text', name, defaultValue);
    let label = createLabel(name, description);
    label.setAttribute('for', name);
    let container = createFlexContainer();
    container.appendChild(input);
    container.appendChild(label);
    return container;
}
function createCheckboxSetting(name, description, defaultValue) {
    let input = createCheckboxInput(name, defaultValue);
    let label = createLabel(name, description);
    let checkboxLabel = createLabel(name, '');
    let checkbox = document.createElement('span');
    checkbox.classList.add('checkbox');
    let container = createFlexContainer('reverse-setting');
    checkboxLabel.appendChild(input);
    checkboxLabel.appendChild(checkbox);
    container.appendChild(checkboxLabel);
    container.appendChild(label);
    container.addEventListener('click', (e) => {
        if (e.target == container) {
            input.checked = !input.checked;
            input.dispatchEvent(new CustomEvent('change', { bubbles: true }));
            updateSetting(name, input.checked);
        }
    });
    return container;
}
function createNumberSetting(name, description, options = {}) {
    let { defaultValue = options.defaultValue ?? 10, min = options.min ?? 1, max = options.max ?? 20, } = options;
    let input = createInput('number', name, defaultValue);
    input.setAttribute('min', min.toString());
    input.setAttribute('max', max.toString());
    let label = createLabel(name, description);
    let container = createFlexContainer('reverse-setting');
    container.appendChild(input);
    container.appendChild(label);
    return container;
}
function createRangeSetting(name, description, options = {}) {
    let { classes = options.classes ?? '', defaultValue = options.defaultValue ?? '100', min = options.min ?? 0, max = options.max ?? 100, unit = options.unit ?? '%', } = options;
    let input = createInput('range', name, defaultValue);
    input.setAttribute('min', min.toString());
    input.setAttribute('max', max.toString());
    let label = createLabel(name, description);
    label.classList.add('full');
    if (getSetting(name) != undefined) {
        input.value = getSetting(name);
    }
    let output = createOutput();
    output.setAttribute('id', `${name}Output`);
    output.setAttribute('for', name);
    output.innerHTML = input.value + unit;
    output.after(unit);
    let container = createFlexContainer();
    if (classes.length) {
        for (let i = classes.length; i--; i >= 0) {
            container.classList.add(classes[i]);
        }
    }
    container.classList.add('flex-wrap');
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(output);
    input.addEventListener('input', () => {
        output.innerHTML = input.value + unit;
    });
    return container;
}
function createProfileManager() {
    function saveProfile() {
        let profileNameInput = container.querySelector('#ProfileName');
        let profileName = profileNameInput?.value ?? 'rotationMasterDefaultProfile';
        if (profileName.indexOf('|') > -1) {
            console.log('Pipe character is not allowed in profile names.');
            return;
        }
        let profiles = localStorage.getItem('rm_profiles');
        // If we do not have profiles set it to be empty
        if (profiles == undefined || profiles == '' || profiles == '|' || profiles === null) {
            profiles = 'Default||';
            localStorage.setItem('rm_profiles', profiles);
        }
        let profilesArray = localStorage
            .getItem('rm_profiles')
            ?.split('|')
            .filter((str) => str !== '');
        // If the profile name doesn't exist in our profiles - add it
        if (!profilesArray?.includes(profileName)) {
            profiles = profiles + '|' + profileName + '|';
            localStorage.setItem('rm_profiles', profiles);
        }
        // Create and update or store any data
        let data = {};
        data['Abilities'] = localStorage['Abilities'];
        data['Settings'] = JSON.parse(localStorage[appName]);
        localStorage.setItem(`rm_profile_${profileName}`, JSON.stringify(data));
        console.log(`${profileName} added to profiles. Existing profiles: \n ${profiles}`);
        location.reload();
    }
    function deleteProfile() {
        let index = container.querySelector('select')?.selectedIndex ?? 0;
        if (index !== 0) {
            let profileName = container.querySelector('select')?.options[index].text;
            console.log(`Deleting: ${profileName} profile`);
            let profiles = localStorage
                .getItem('rm_profiles')
                ?.split('|')
                .filter((str) => str !== '');
            profiles = profiles?.filter((item) => item !== profileName);
            localStorage.setItem('rm_profiles', profiles?.join('|') + '|');
            localStorage.removeItem(`rm_profile_${profileName}`);
        }
        location.reload();
    }
    function loadProfile() {
        let index = container.querySelector('select')?.selectedIndex ?? 0;
        if (index !== 0) {
            let profiles = localStorage
                .getItem('rm_profiles')
                ?.split('|')
                .filter((str) => str !== '');
            if (profiles) {
                let storageName = profiles[index - 1];
                let data = JSON.parse(localStorage.getItem(`rm_profile_${storageName}`) ?? '');
                if (data['Abilities'] !== undefined && data['Abilities'] !== '') {
                    localStorage.setItem('Abilities', data['Abilities']);
                }
                Object.entries(data['Settings']).forEach((setting) => {
                    updateSetting(setting[0], setting[1]);
                });
            }
        }
        location.reload();
    }
    let profileOptions = [{ value: '0', name: 'Select Profile' }];
    let profiles;
    if (localStorage.getItem('rm_profiles')) {
        profiles = localStorage
            .getItem('rm_profiles')
            ?.split('|')
            .filter((str) => str !== '');
        profiles?.forEach((profile, index) => {
            profileOptions.push({ value: index.toString(), name: profile });
        });
    }
    else {
        profiles = 'Default||';
        localStorage.setItem('rm_profiles', profiles);
    }
    var profileHeader = createHeading('h3', 'Profiles');
    var profileText = createText('Select a profile to load or delete. To save a new profile, give it a name in the field below and then click Save. To update an existing profile save a profile using the same name.');
    var saveButton = createButton('Save', saveProfile, {
        classes: ['nisbutton'],
    });
    var profileName = createInput('text', 'ProfileName', '');
    profileName.classList.add('profile-name');
    var loadOptions = createDropdownSetting('Profile', '', 'Add', profileOptions);
    loadOptions.classList.add('profile-list');
    const selectElement = loadOptions.querySelector('select');
    if (selectElement) {
        selectElement.selectedIndex = 0;
    }
    else {
        console.error("Select element not found in 'loadOptions'.");
    }
    var loadButton = createButton('Load', loadProfile, {
        classes: ['nisbutton'],
    });
    loadButton.classList.add('load-btn');
    var deleteButton = createButton('Delete', deleteProfile, {
        classes: ['nisbutton', 'delete'],
    });
    var container = createFlexContainer();
    container.classList.remove('flex');
    var endSeperator = createSeperator();
    container.classList.add('flex-wrap');
    container.appendChild(profileHeader);
    container.appendChild(profileText);
    container.appendChild(loadOptions);
    container.appendChild(document.createElement('br'));
    container.appendChild(saveButton);
    container.appendChild(profileName);
    container.appendChild(loadButton);
    container.appendChild(deleteButton);
    //container.appendChild(deleteButton);
    container.appendChild(endSeperator);
    return container;
}
function createLabel(name, description) {
    let label = document.createElement('label');
    label.setAttribute('for', name);
    label.innerHTML = description;
    return label;
}
function createInput(type, name, defaultValue) {
    let input = document.createElement('input');
    input.id = name;
    input.type = type;
    input.dataset.setting = name;
    input.dataset.defaultValue = defaultValue;
    input.value = input.dataset.defaultValue ?? '';
    if (getSetting(name)) {
        input.value = getSetting(name) ?? input.dataset.defaultValue;
    }
    else {
        updateSetting(name, input.dataset.defaultValue);
    }
    input.addEventListener('change', () => {
        if (type == 'text') {
            updateSetting(name, input.value);
        }
        else if (type == 'number' || type == 'range') {
            updateSetting(name, parseInt(input.value, 10));
        }
    });
    return input;
}
function createCheckboxInput(name, defaultValue) {
    let input = document.createElement('input');
    input.id = name;
    input.type = 'checkbox';
    input.dataset.setting = name;
    input.dataset.defaultValue = defaultValue;
    input.checked = defaultValue;
    if (getSetting(name)) {
        input.checked = getSetting(name);
    }
    else {
        updateSetting(name, input.checked);
    }
    input.addEventListener('change', () => {
        updateSetting(name, input.checked);
    });
    return input;
}
function createDropdown(name, defaultValue, options) {
    let select = document.createElement('select');
    select.id = name;
    select.dataset.setting = name;
    select.dataset.defaultValue = defaultValue;
    select.value = defaultValue;
    if (getSetting(name)) {
        select.value = getSetting(name);
    }
    for (var i = 0; i < options.length; i++) {
        let option = document.createElement('option');
        option.value = options[i].value;
        option.text = options[i].name;
        select.appendChild(option);
    }
    if (getSetting(name)) {
        select.value = getSetting(name);
    }
    else {
        updateSetting(name, select.value);
    }
    select.addEventListener('change', () => {
        updateSetting(name, select.value);
    });
    return select;
}
function createOutput() {
    let output = document.createElement('output');
    return output;
}
function createFlexContainer(classes) {
    let container = document.createElement('div');
    container.classList.add('flex');
    container.classList.add('setting');
    if (classes) {
        container.classList.add(classes);
    }
    return container;
}
function setDefaultSettings() {
    let settings = document.querySelectorAll('[data-setting]');
    settings.forEach((setting) => {
        switch (setting.type) {
            case 'number':
            case 'range':
                updateSetting(setting.dataset.setting, parseInt(setting.dataset.defaultValue, 10));
                break;
            case 'checkbox':
                if (setting.dataset.defaultValue == 'false') {
                    updateSetting(setting.dataset.setting, false);
                }
                else {
                    updateSetting(setting.dataset.setting, true);
                }
                break;
            default:
                updateSetting(setting.dataset.setting, setting.dataset.defaultValue);
        }
    });
}
function loadSettings() {
    let settings = document.querySelectorAll('[data-setting]');
    settings.forEach((setting) => {
        switch (setting.type) {
            case 'number':
            case 'range':
                setting.value =
                    getSetting(setting.dataset.setting) ??
                        setting.dataset.defaultValue;
                break;
            case 'checkbox':
                setting.checked =
                    getSetting(setting.dataset.setting) ||
                        setting.dataset.defaultValue;
                break;
            default:
                setting.value =
                    getSetting(setting.dataset.setting) ||
                        setting.dataset.defaultValue;
        }
    });
}
function settingsExist() {
    if (!localStorage[appName]) {
        setDefaultSettings();
    }
    else {
        loadSettings();
    }
}
function getSetting(setting) {
    if (!localStorage[appName]) {
        localStorage.setItem(appName, JSON.stringify({}));
        setDefaultSettings();
    }
    return JSON.parse(localStorage[appName])[setting];
}
function updateSetting(setting, value) {
    if (!localStorage.getItem(appName)) {
        localStorage.setItem(appName, JSON.stringify({}));
    }
    var save_data = JSON.parse(localStorage[appName]);
    save_data[setting] = value;
    localStorage.setItem(appName, JSON.stringify(save_data));
}
async function timeout(millis) {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
}


/***/ }),

/***/ "./src/appconfig.json":
/*!****************************!*\
  !*** ./src/appconfig.json ***!
  \****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "appconfig.json";

/***/ }),

/***/ "./src/icon.png":
/*!**********************!*\
  !*** ./src/icon.png ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "icon.png";

/***/ }),

/***/ "./src/index.html":
/*!************************!*\
  !*** ./src/index.html ***!
  \************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "index.html";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   startRotationMaster: () => (/* binding */ startRotationMaster)
/* harmony export */ });
/* harmony import */ var _a1sauce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./a1sauce */ "./src/a1sauce.ts");
/* harmony import */ var _index_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./index.html */ "./src/index.html");
/* harmony import */ var _appconfig_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./appconfig.json */ "./src/appconfig.json");
/* harmony import */ var _icon_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./icon.png */ "./src/icon.png");




var currentOverlayPosition = _a1sauce__WEBPACK_IMPORTED_MODULE_0__.getSetting('overlayPosition');
function getByID(id) {
    return document.getElementById(id);
}
const rotationDiv = getByID('rotation');
const dropdownsContainer = getByID('dropdowns-container');
const overlay = getByID('overlay');
let dropdowns = [];
let abilities = [];
let elements = [];
let rotationName = "Untitled Rotation";
//fetch abilities data
const fetchAbilities = async () => {
    try {
        const response = await fetch('./abilities.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        abilities = await response.json();
        console.log("Fetched abilities:", abilities);
    }
    catch (error) {
        console.error("Error fetching abilities.json:", error);
    }
};
// Add a new dropdown
const addDropdown = () => {
    const id = elements.length;
    elements.push({ id });
    dropdowns.push({ id, selectedAbility: null });
    renderDropdowns();
};
// Render dropdowns
const renderDropdowns = () => {
    if (!dropdownsContainer)
        return; // Check if dropdownsContainer exists)
    dropdownsContainer.innerHTML = ""; // Clear existing dropdowns
    dropdowns.forEach((dropdown, index) => {
        const container = document.createElement("div");
        container.className = "dropdown-container";
        // Create dropdown
        const select = document.createElement("select");
        select.className = "nisdropdown";
        select.innerHTML = `<option value="">Select an ability</option>`;
        abilities.forEach((ability) => {
            const option = document.createElement("option");
            option.value = ability.Emoji;
            option.textContent = ability.Emoji;
            if (dropdown.selectedAbility && dropdown.selectedAbility.Emoji === ability.Emoji) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        select.addEventListener("change", (e) => {
            const selectedEmoji = e.target.value;
            const ability = abilities.find((a) => a.Emoji === selectedEmoji);
            dropdowns[index].selectedAbility = ability || null;
            updateOverlay();
        });
        container.appendChild(select);
        // Add buttons
        const upButton = document.createElement("button");
        upButton.textContent = "Up";
        upButton.disabled = index === 0;
        upButton.addEventListener("click", () => moveUp(index));
        container.appendChild(upButton);
        const downButton = document.createElement("button");
        downButton.textContent = "Down";
        downButton.disabled = index === dropdowns.length - 1;
        downButton.addEventListener("click", () => moveDown(index));
        container.appendChild(downButton);
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => removeDropdown(index));
        container.appendChild(deleteButton);
        dropdownsContainer.appendChild(container);
    });
};
// Move dropdown up
const moveUp = (index) => {
    if (index > 0) {
        [dropdowns[index - 1], dropdowns[index]] = [dropdowns[index], dropdowns[index - 1]];
        renderDropdowns();
    }
};
// Move dropdown down
const moveDown = (index) => {
    if (index < dropdowns.length - 1) {
        [dropdowns[index + 1], dropdowns[index]] = [dropdowns[index], dropdowns[index + 1]];
        renderDropdowns();
    }
};
// Remove a dropdown
const removeDropdown = (index) => {
    dropdowns.splice(index, 1);
    elements.splice(index, 1);
    renderDropdowns();
};
// Update overlay
const updateOverlay = () => {
    if (overlay) {
        overlay.innerHTML = dropdowns
            .filter((dropdown) => dropdown.selectedAbility)
            .map((dropdown) => `<img src="${dropdown.selectedAbility.Src}" alt="${dropdown.selectedAbility.Emoji}" class="overlay-image" />`)
            .join(" > ");
    }
};
let config = {
    appName: 'rotationMaster',
};
//let helperItems = {
//  Output: getByID('output'),
//  settings: getByID('Settings'),
//  RotationMaster: getByID('RotationMaster'),
//  Abilities: <HTMLUListElement>getByID('Abilities'),
//  ToggleOverlayButton: getByID('ToggleOverlayButton'),
//  NameOutput: getByID('NameOutput'),
//};
async function startRotationMaster() {
    if (!window.alt1) {
        //helperItems.Output?.insertAdjacentHTML(
        //  'beforeend',
        //  `<div>You need to run this page in alt1 to capture the screen</div>`
        //);
        return;
    }
    if (!alt1.permissionPixel) {
        //helperItems.Output?.insertAdjacentHTML(
        //  'beforeend',
        //  `<div><p>Page is not installed as app or capture permission is not enabled</p></div>`
        //);
        return;
    }
    if (!alt1.permissionOverlay) {
        //helperItems.Output?.insertAdjacentHTML(
        //  'beforeend',
        //  `<div><p>Attempted to use Overlay but app overlay permission is not enabled. Please enable "Show Overlay" permission in Alt1 settinsg (wrench icon in corner).</p></div>`
        //);
        return;
    }
    await fetchAbilities();
    //add controls to page
    const controls = getByID('rotation-controls');
    if (controls) {
        const addButton = document.createElement('button');
        addButton.textContent = "Add New";
        addButton.addEventListener("click", addDropdown);
        controls.appendChild(addButton);
        const clearButton = document.createElement("button");
        clearButton.textContent = "Clear All";
        clearButton.addEventListener("click", () => {
            dropdowns = [];
            elements = [];
            renderDropdowns();
        });
        controls.appendChild(clearButton);
    }
    renderDropdowns();
    //if (sauce.getSetting('activeOverlay')) {
    //  var abilitiesElement = getByID('Abilities')
    //  if (abilitiesElement != null)
    //    startOverlay(abilitiesElement);
    //} else {
    //  helperItems.RotationMaster?.classList.add('overlay-disabled');
    //}
}
//async function startOverlay(element: HTMLElement) {
//  let overlay = element;
//  let styles = getComputedStyle(overlay);
//  let totalTrackeDItems = sauce.getSetting('totalTrackedItems');
//  let buffsPerRow = sauce.getSetting('buffsPerrow');
//  let refreshRate = parseInt(sauce.getSetting('overlayRefreshRate'), 10);
//  let overlayPosition;
//  await sauce.timeout(1000);
//  while (true) {
//    let uiScale = sauce.getSetting('uiScale');
//    overlayPosition = currentOverlayPosition;
//    try {
//      let dataUrl = await htmlToImage.toCanvas(overlay, {
//        backgroundColor: 'transparent',
//        width: parseInt(styles.minWidth, 10),
//        height:
//          parseInt(styles.minHeight, 10) +
//          Math.floor(totalTrackeDItems / buffsPerRow + 1) *
//          27 *
//          (uiScale / 100),
//        quality: 1,
//        pixelRatio: uiScale / 100 - 0.00999999999999999999,
//        skipAutoScale: true,
//      });
//      if (element == getByID('Abilities')) {
//        let base64 = dataUrl
//          .getContext('2d')
//          ?.getImageData(0, 0, dataUrl.width, dataUrl.height);
//        alt1.overLaySetGroup('region');
//        alt1.overLayFreezeGroup('region');
//        alt1.overLayClearGroup('region');
//        if (base64)
//          alt1.overLayImage(
//            overlayPosition.x,
//            overlayPosition.y,
//            a1lib.encodeImageString(base64),
//            base64.width,
//            refreshRate
//          );
//        alt1.overLayRefreshGroup('region');
//      }
//      else {
//        alt1.overLayClearGroup('region');
//        alt1.overLayRefreshGroup('region');
//      }
//    }
//    catch (e) {
//      console.error(`html-to-image failed to capture`, e);
//    }
//  }
//}
//async function setInactive(element: HTMLElement) {
//  if (!(element.dataset.startedTimer == 'true')) {
//    element.classList.add('inactive');
//    element.classList.remove('active');
//    element.dataset.time = '';
//  } else if (element.dataset.startedFimer == 'false') {
//    element.classList.remove('cooldown');
//    element.dataset.cooldown = '';
//  }
//}
//// loads all images as raw pixel data async, images have to be saved as *.data.png
//// this also takes care of metadata headers in the image that make browser load the image
//// with slightly wrong colors
//// this function is async, so you cant acccess the images instantly but generally takes <20ms
//// use `await imgs.promise` if you want to use the images as soon as they are loaded
//const abilityImages = a1lib.webpackImages(
//  abilitiesData.reduce((acc: { [x: string]: any; }, ability: { Title: any; Src: string; }) => {
//    const key = ability.Title;
//    const value = require(ability.Src.replace('./asset/resource', './asset/data').replace('.webp', '-noborder.data.png'));
//    acc[key] = value;
//    return acc;
//  }, {} as Record<string, any>)
//);
//let updatingOverlayPosition = false;
//function updateLocation(e: any) {
//  let ab = getByID('Abilities');
//  if (!ab) return;
//  sauce.updateSetting('overlayPosition', {
//    x: Math.floor(
//      e.x - (sauce.getSetting('uiScale') / 100) * (ab.offsetWidth / 2)
//    ),
//    y: Math.floor(
//      e.y - (sauce.getSetting('uiScale') / 100) * (ab.offsetHeight / 2)
//    ),
//  });
//  updatingOverlayPosition = false;
//  helperItems.RotationMaster?.classList.toggle(
//    'positioning',
//    updatingOverlayPosition
//  )
//}
//function initSettings() {
//  if (!localStorage[config.appName]) {
//    setDefaultSettings();
//  }
//  loadSettings();
//}
//function deleteLocalStorage() {
//  localStorage.removeItem(config.appName);
//  localStorage.removeItem('Abilities');
//  location.reload();
//}
//function setDefaultSettings() {
//  localStorage.setItem(
//    config.appName,
//    JSON.stringify({
//      activeOverlay: true,
//      overlayPosition: { x: 100, y: 100 },
//      uiScale: 100,
//      updatingOverlayPosition: false,
//      abilitiesPerRow: 10,
//    })
//  )
//}
//function loadSettings() {
//  getByID('Abilities')?.style.setProperty(
//    '--maxcount',
//    sauce.getSetting('buffsPerRow')
//  );
//  getByID('Abilities')?.style.setProperty(
//    '--totalitems',
//    helperItems.Abilities.children.length.toString()
//  );
//  getByID('Abilities')?.style.setProperty(
//    '--scale',
//    sauce.getSetting('uiScale')
//  );
//  const inputElement = settingsObject.UIScale.querySelector('input')
//  if (inputElement && parseInt(inputElement.value, 10) < 100) {
//    helperItems.Abilities.classList.add('scaled');
//  }
//}
const currentVersion = '2.0.0';
//const settingsObject = {
//  settingsHeader: sauce.createHeading(
//    'h2',
//    'Rotation Master - v' + currentVersion
//  ),
//  AbilitiesPerRow: sauce.createNumberSetting(
//    'abilitiesPerRow',
//    'Number of abilities displayed per row',
//    { defaultValue: 10, min: 1, max: 20 }
//  ),
//  Brightness: sauce.createRangeSetting(
//    'brightness',
//    '<u>Light Level</u> Control how dark inactive buffs should be - lower number being darker',
//    { defaultValue: '75', min: 5, max: 100, unit: '%' }
//  ),
//  endGeneral: sauce.createSeperator(),
//  OverlayHeader: sauce.createHeading('h2', 'Overlay'),
//  OverlayActive: sauce.createCheckboxSetting(
//    'activeOverlay',
//    "<u>Enable Overlay</u> When the overlay is toggled off - the app will hide the entire UI unless your mouse is over the app. This is for users who don't mind having a background and want to avoid the delay the overlay has",
//    sauce.getSetting('activeOverlay') ?? false
//  ),
//  OverlaySmallText: sauce.createSmallText(
//    `If the overlay does not show - check the "Show overlay" permission is enabled for this plugin in Alt1's settings or try setting the position using the button below.`
//  ),
//  OverlayPositionButton: sauce.createButton(
//    'Set Overlay Position',
//    setOverlayPosition,
//    { classes: ['nisbutton'] }
//  ),
//  ScaleHeader: sauce.createHeading('h3', 'Scale'),
//  UIScale: sauce.createRangeSetting(
//    'uiScale',
//    'Adjusts the size of the Overlay',
//    {
//      defaultValue: '100',
//      min: 50,
//      max: 200,
//    }
//  ),
//  OverlayRefreshHeader: sauce.createHeading('h3', 'Refresh Rate'),
//  OverlayRefreshRate: sauce.createRangeSetting(
//    'overlayRefreshRate',
//    'The rate that the overlay should refresh - in milliseconds. Requires reloading to take effect.',
//    { defaultValue: '50', min: 20, max: 500, unit: 'ms' }
//  ),
//  endOverlay: sauce.createSeperator(),
//  ResetHeader: sauce.createHeading('h3', 'Reset Config'),
//  ResetText: sauce.createText(
//    `This will reset your configuration and reload the plugin in an attempt to solve any problems caused by missing or bad values`
//  ),
//  resetButton: sauce.createButton('Reset All Settings', deleteLocalStorage, {
//    classes: ['nisbutton'],
//  }),
//};
//async function setOverlayPosition() {
//  a1lib.once('alt1pressed', updateLocation);
//  let oldPosition = sauce.getSetting('overlayPosition');
//  sauce.updateSetting('oldOverlayPosition', oldPosition);
//  updatingOverlayPosition = true;
//  helperItems.RotationMaster?.classList.toggle(
//    'positioning',
//    updatingOverlayPosition
//  );
//  while (updatingOverlayPosition) {
//    alt1.setTooltip('Press Alt+1 to save position');
//    let rm = getByID('RotationMaster');
//    if (!rm) return;
//    sauce.updateSetting('overlayPosition', {
//      x: Math.floor(
//        a1lib.getMousePosition()?.x ?? 100 -
//        (sauce.getSetting('uiScale') / 100) * (rm.offsetWidth / 2)
//      ),
//      y: Math.floor(
//        a1lib.getMousePosition()?.y ?? 100 -
//        (sauce.getSetting('uiScale') / 100) * (rm.offsetHeight / 2)
//      ),
//    });
//    currentOverlayPosition = sauce.getSetting('overlayPosition');
//    alt1.overLayRefreshGroup('group1')
//    await sauce.timeout(200);
//  }
//}
window.onload = function () {
    startRotationMaster();
    //check if we are running inside alt1 by ckecking if alt1 gloabl exists
    if (window.alt1) {
        //tell alt1 about the app
        //this makes alt1 show the add app button when running inside the embedded browser
        //also updates app settings if they are changed
        alt1.identifyAppUrl('./appconfig.json');
        //initSettings();
        //let settings = document.querySelector('#Settings .container');
        //Object.values(settingsObject).forEach((val) => {
        //  settings?.before(val);
        //});
        //  const brightnessInput = settingsObject.Brightness.querySelector('input');
        //  if (brightnessInput)
        //    document.documentElement.style.setProperty(
        //      '--brightness',
        //      parseInt(brightnessInput.value, 10  / 100).toString()
        //    );
        //  const mutationConfig = {
        //    attributes: false,
        //    childList: true,
        //    subtree: false,
        //  };
        //  const callback = (mutationList: any, observer: any) => {
        //    for (const mutation of mutationList) {
        //      const brightnessInput = settingsObject.Brightness.querySelector('input');
        //      if (mutation.type === 'childList' && brightnessInput) {
        //        document.documentElement.style.setProperty(
        //          '--brightness',
        //          (parseInt( brightnessInput.value, 10 ) / 100 ).toString()
        //        );
        //      }
        //    }
        //  };
        //  const observer = new MutationObserver(callback);
        ////  observer.observe(helperItems.Abilities, mutationConfig);
        //} else {
        //  let addappurl = `alt1://addapp/${new URL('./appconfig.json', document.location.href).href
        //    }`;
        //  helperItems.Output?.insertAdjacentHTML(
        //    'beforeend',
        //    `
        //	Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1
        //`
        //  );
    }
};

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});