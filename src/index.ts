import './css/main.scss';
import abilities from './asset/abilities.json';
import * as A1 from '@alt1/base';
import * as sauce from './a1sauce';
import * as htmlToImage from 'html-to-image';

var currentOverlayPosition = sauce.getSetting('overlayPosition');
let updatingOverlayPosition = false;
let savedRotationsCache: Rotation[] = [];

const loadSavedRotations = () => {
  const cachedRotations = localStorage.getItem('savedRotations');
  savedRotationsCache = cachedRotations ? JSON.parse(cachedRotations) : [];
};


const elementCache: Record<string, HTMLElement | null> = {};

// Utility function to get elements by ID
function getById(id: string): HTMLElement | null {
  // Check if the element is already cached
  if (elementCache[id]) {
    return elementCache[id];
  }

  // If not cached, retrieve the element from the DOM
  const element = document.getElementById(id);
  // save to cache
  elementCache[id] = element;

  return element;
}

// Define variables
let rotationName = '';

type Dropdown = {
  selectedAbility: Ability | null; // The currently selected ability, or null if none is selected
};
type Rotation = {
  name: string;
  data: Ability[];
}
type Ability = {
  Title: string;
  Emoji: string;       // The emoji representing the ability
  EmojiId: string;     // A unique identifier for the ability
  Category: string;    // The category of the ability
  Src: string;         // The source URL for the ability's image
  Keybind?: string;    // Optional keybind for the ability
};
const dropdowns: Dropdown[] = []; // Initialize as an empty array

// Retrieve saved rotations from localStorage
const cachedRotations = localStorage.getItem("savedRotations");
const savedRotations = cachedRotations ? JSON.parse(cachedRotations) : [];

// Function to render dropdowns (placeholder for your existing logic)
const renderDropdowns = () => {
  const dropdownContainer = getById('dropdowns-container');
  if (!dropdownContainer) return;

  const fragment = document.createDocumentFragment();

  dropdowns.forEach((dropdown, index) => {
    const dropdownDiv = document.createElement('div');
    dropdownDiv.className = 'ability-dropdown';

    //Create the filter input
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = 'Search...';
    filterInput.className = 'nisinput';
    const debounce = (func: Function, delay: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
      };
    };
    filterInput.addEventListener(
      'input',
      debounce((e : any) => {
        const filter = (e.target as HTMLInputElement).value.toLowerCase();
        const filteredAbilities = abilities.filter(
          (a: any) =>
            a.Category.toLowerCase().includes(filter) ||
            a.Emoji.toLowerCase().includes(filter)
        );
        updateDropdownOptions(selectElement, filteredAbilities);
      }, 300)
    );

    // Create the dropdown select
    const selectElement = document.createElement('select');
    selectElement.className = 'nisdropdown';
    selectElement.innerHTML = `<option value="">Select an ability</option>`;
    abilities.forEach((a: Ability) => {
      const option = document.createElement('option');
      option.value = a.Emoji;
      option.textContent = a.Emoji;
      selectElement.appendChild(option);
    });

    // Set the selected value if available
    if (dropdown.selectedAbility) {
      selectElement.value = dropdown.selectedAbility.Emoji;
    }

    selectElement.addEventListener('change', (e) => {
      const selectedAbility = (e.target as HTMLSelectElement).value;
      const ability = abilities.find((a: Ability) => a.Emoji === selectedAbility);
      if (ability != null) {
        //assign the ability to the dropdowns
        dropdowns[index].selectedAbility = ability;
        //update the image
        abilityImage.src = ability.Src;
        abilityImage.alt = ability.Emoji;

        // Update the overlay
        renderRotationPreview();
      }

    });

    // Create the image for the selected ability
    const abilityImage = document.createElement('img');
    abilityImage.className = 'ability-image';
    if (dropdown.selectedAbility) {
      abilityImage.src = dropdown.selectedAbility.Src;
      abilityImage.alt = dropdown.selectedAbility.Emoji;
    }

    // Create the keybind inputs for the ability
    const keybindInput = document.createElement('input');
    keybindInput.type = 'text';
    keybindInput.placeholder = 'Keybind (optional)';
    keybindInput.className = 'nisinput keybind-input';
    if (dropdown.selectedAbility && dropdown.selectedAbility.Keybind) {
      keybindInput.value = dropdown.selectedAbility.Keybind;
    }
    keybindInput.addEventListener('keydown', (e) => {
      // Prevent default action to avoid typing in the input
      e.preventDefault();

      if (e.key === 'Escape') {
        // Clear the keybind input if Escape is pressed
        keybindInput.value = '';
        delete dropdown.selectedAbility!.Keybind;
        renderRotationPreview();
        return;
      }

      const keybind = (e.key as string);
      // Check to see if modifier keys are pressed
      const modifier = [e.ctrlKey, e.altKey, e.shiftKey].filter(Boolean).map((mod) => {
        if (mod === e.ctrlKey) return 'Ctrl';
        if (mod === e.altKey) return 'Alt';
        if (mod === e.shiftKey) return 'Shift';
        return '';
      }).join('+');
      // Set the keybind input value
      keybindInput.value = modifier ? `${modifier} + ${keybind}` : keybind;

      // Update the selected ability's keybind
      if (dropdown.selectedAbility) {
        dropdown.selectedAbility.Keybind = keybindInput.value;
      }

      renderRotationPreview();
    });

    // Create the button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';

    // Move Up Button
    const moveUpButton = document.createElement('button');
    moveUpButton.className = 'nisbutton up-button';
    moveUpButton.innerHTML = `<i class="fa-solid fa-chevron-up"></i>`;
    moveUpButton.disabled = index === 0;
    moveUpButton.addEventListener('click', () => {
      if (index > 0) {
        [dropdowns[index - 1], dropdowns[index]] = [dropdowns[index], dropdowns[index - 1]];
        renderDropdowns();
        renderRotationPreview();
      }
    });

    // Move Down Button
    const moveDownButton = document.createElement('button');
    moveDownButton.className = 'nisbutton down-button';
    moveDownButton.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
    moveDownButton.disabled = index === dropdowns.length - 1;
    moveDownButton.addEventListener('click', () => {
      if (index < dropdowns.length - 1) {
        [dropdowns[index], dropdowns[index + 1]] = [dropdowns[index + 1], dropdowns[index]];
        renderDropdowns();
        renderRotationPreview();
      }
    });

    // Delete Button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'nisbutton delete-button';
    deleteButton.innerHTML = `<i class="fas fa-trash-alt"></i>`;
    deleteButton.addEventListener('click', () => {
      dropdowns.splice(index, 1);
      renderDropdowns();
      renderRotationPreview();
    });


    // Append buttons to the button group
    buttonGroup.appendChild(moveUpButton);
    buttonGroup.appendChild(moveDownButton);
    buttonGroup.appendChild(deleteButton);

    // Append all elements to the dropdown container
    dropdownDiv.appendChild(filterInput);
    dropdownDiv.appendChild(selectElement);
    dropdownDiv.appendChild(abilityImage);
    dropdownDiv.appendChild(keybindInput);
    dropdownDiv.appendChild(buttonGroup);

    // Append the dropdown container to the main container
    fragment.appendChild(dropdownDiv);
  });

  dropdownContainer.innerHTML = ''; // Clear existing dropdowns
  dropdownContainer.appendChild(fragment);
};

const updateDropdownOptions = (selectElement: HTMLSelectElement, abilities: Ability[]) => {
  selectElement.innerHTML = `<option value="">Select an ability</option>`;
  abilities.forEach((ability) => {
    const option = document.createElement('option');
    option.value = ability.Emoji;
    option.textContent = ability.Emoji;
    selectElement.appendChild(option);
  });
};

// Handle rotation name input
const rotationNameInput = getById('rotation-name') as HTMLInputElement;
if (rotationNameInput) {
  rotationNameInput.addEventListener('input', (e) => {
    rotationName = (e.target as HTMLInputElement).value;
  });
}

// Populate the dropdown with saved rotations
const populateSavedRotations = () => {
  const selectElement = document.getElementById("savedRotations") as HTMLSelectElement;
  selectElement.innerHTML = ""; // Clear existing options

  const cachedRotations = localStorage.getItem("savedRotations");
  const savedRotations = cachedRotations ? JSON.parse(cachedRotations) : [];

  // Add a default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = "Select Saved Rotation";
  selectElement.appendChild(defaultOption);

  // Add saved rotations from localStorage
  savedRotations.forEach((rotation: Rotation) => {
    const option = document.createElement("option");
    option.value = rotation.name;
    option.textContent = rotation.name;
    selectElement.appendChild(option);
  });
};


// Save rotation
const saveRotation = (rotationName: string, rotationData: any) => {
  const existingIndex = savedRotationsCache.findIndex(
    (rotation) => rotation.name === rotationName
  );

  if (existingIndex !== -1) {
    savedRotationsCache[existingIndex] = { name: rotationName, data: rotationData };
  } else {
    savedRotationsCache.push({ name: rotationName, data: rotationData });
  }

  localStorage.setItem('savedRotations', JSON.stringify(savedRotationsCache));

  // Refresh the dropdown
  populateSavedRotations();
  renderRotationPreview();

  // set the selected rotation to the one you just saved
  const rotationDropdown = getById('savedRotations') as HTMLSelectElement;
  if (rotationDropdown) {
    const option = Array.from(rotationDropdown.options).find((opt) => opt.value === rotationName);
    if (option) {
      rotationDropdown.value = rotationName;
    }
  }
};

const handleSaveRotation = () => {
  if (!rotationName.trim()) {
    try {
      const rotationNameInput = getById('rotation-name') as HTMLInputElement;
      if (rotationNameInput?.value?.trim()) {
        rotationName = rotationNameInput.value.trim();
      }
      else {
        console.error("Please enter a valid rotation name.");
        return;
      }
    }
    catch (e) {
      console.error(`An error occured setting the rotation name. ${e}`);
      return;
    }
  }

  const rotationData = dropdowns.map((dropdown) => dropdown.selectedAbility); // Add any other data you want to save
  saveRotation(rotationName, rotationData);
  console.log("Rotation saved successfully!");
};
// Expose function to the global scope so it can be called from HTML
getById('saveButton')?.addEventListener('click', handleSaveRotation);

const handleExportRotation = () => {
  console.log("Exporting Rotation");
  const rotationData = dropdowns.map((dropdown) => dropdown.selectedAbility);
  const dataStr = JSON.stringify(rotationData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${rotationName.trim() ?? 'Untitled Rotation'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
getById('exportButton')?.addEventListener('click', handleExportRotation);

const handleImportRotation = () => {
  console.log("Importing Rotation")

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  // Add an event listener to handle file selection
  fileInput.addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      alert("No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result;
      if (typeof contents === "string") {
        try {
          let parsedData = JSON.parse(contents);

          // Check if the parsed data is in the old format
          if (
            Array.isArray(parsedData) &&
            parsedData.length > 0 &&
            parsedData[0].hasOwnProperty("selectedAbility")
          ) {
            // Old format
            let rotationData = parsedData.map((item: any) => item.selectedAbility);

            // Map old data to full ability details
            rotationData = rotationData
              .map((item: any) => {
                const ability = abilities.find((a: Ability) => a.Emoji === item.Emoji);
                return ability ? { ...ability } : null;
              })
              .filter((item: any) => item !== null);

            // Map rotationData to dropdowns
            rotationData = rotationData.map((ability: Ability) => ({ selectedAbility: ability }));

            dropdowns.splice(0, dropdowns.length, ...rotationData);
          } else {
            // New format
            // update ability info from abilities.json incase images have changed
            parsedData = parsedData.map((item: any) => {
              const ability = abilities.find((a: Ability) => a.Emoji === item.Emoji);
              return ability ? { ...ability, Keybind: item.Keybind || '' } : null;
            }).filter((item: any) => item !== null);

            // the parsed data must be an array of dropdowns
            const parsedAbilities = parsedData.map((ability: Ability) => ({ selectedAbility: ability }));
            
            dropdowns.splice(0, dropdowns.length, ...parsedAbilities);
          }

          renderDropdowns();

        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Invalid JSON file.");
        }
      }
      // Update the overlay
      renderRotationPreview();
    };

    // Read the file as text
    reader.readAsText(file);
  });

  // Trigger the file input dialog
  fileInput.click();
};
getById('importButton')?.addEventListener('click', handleImportRotation);

const handleSwitchRotation = (rotationName: string) => {
  // Retrieve the saved rotations from localStorage
  const cachedRotations = localStorage.getItem("savedRotations");
  const savedRotations = cachedRotations ? JSON.parse(cachedRotations) : [];


  const selectedRotation = savedRotations.find(
    (rotation: Rotation) => rotation.name === rotationName
  );

  if (!selectedRotation) {
    alert('Rotation not found.');
    return;
  }

  // change the rotation name input to the selected rotation name
  const rotationNameInput = getById('rotation-name') as HTMLInputElement;
  if (rotationNameInput) {
    rotationNameInput.value = selectedRotation.name;
  }

  // Clear the current dropdowns
  dropdowns.splice(0, dropdowns.length);

  // Populate dropdowns with the saved rotation data
  const rotationData = Array.isArray(selectedRotation.data) ? selectedRotation.data : [selectedRotation.data];

  rotationData.forEach((ability : Ability) => {
    dropdowns.push({ selectedAbility: ability });
  });

  // Re-render the dropdowns
  renderDropdowns();

  // Update the overlay
  renderRotationPreview();
};
getById('savedRotations')?.addEventListener('change', (e) => {
  const selectedRotation = (e.target as HTMLSelectElement).value;
  handleSwitchRotation(selectedRotation);
});

const addDropdown = () => {
  dropdowns.push({ selectedAbility: null });
  renderDropdowns();
}
getById('addActionButton')?.addEventListener('click', addDropdown);


// Delete rotation
const deleteRotation = () => {
  const rotationDropdown = getById('savedRotations') as HTMLSelectElement;
  const selectedRotation = rotationDropdown?.value;
  if (!selectedRotation) {
    alert('Please select a rotation to delete.');
    return;
  }
  const index = savedRotations.findIndex((r : any) => r.name === selectedRotation);
  if (index !== -1) {
    savedRotations.splice(index, 1);
    // Save the updated rotations back to localStorage
    localStorage.setItem("savedRotations", JSON.stringify(savedRotations));

    populateSavedRotations();
    alert('Rotation deleted successfully!');
    clearDropdowns();
  }
};
getById('deleteRotButton')?.addEventListener('click', deleteRotation);

// Clear all dropdowns
const clearDropdowns = () => {
  console.log("clearing dropdowns " + dropdowns.length);
  dropdowns.splice(0, dropdowns.length); // Clear the array by removing all elements
  renderDropdowns();
  renderRotationPreview();
};
getById('clearButton')?.addEventListener('click', clearDropdowns);

// Function to update the overlay div
const renderRotationPreview = () => {
  const overlay = getById('rotation-preview');
  const toggle = getById('toggleDetailsButton');
  if (!overlay || !toggle) return;

  // Get the number of images per row from settings
  const numImagesPerRow = sauce.getSetting('ablitiesPerRow');

  // Filter dropdowns with selected abilities and map them to image elements
  const selectedAbilities = dropdowns.filter((dropdown) => dropdown.selectedAbility);
  const rowspacer = '<span class="row-spacer" > > </span>'

  // Group the images into rows
  const rows: string[] = [];
  for (let i = 0; i < selectedAbilities.length; i += numImagesPerRow) {
    const rowImages = selectedAbilities
      .slice(i, i + numImagesPerRow)
      .map(
        (dropdown) =>
          `<div class="rotation-preview-image-container" ${dropdown.selectedAbility!.Keybind && `style="--keybind:'${dropdown.selectedAbility!.Keybind}';"`}>
            <img src="${dropdown.selectedAbility!.Src}" alt="${dropdown.selectedAbility!.Emoji}" class="rotation-preview-image" />
          </div>`
      )
      .join(rowspacer);
    // Add ' > ' before rows that are not the first row
    const rowPrefix = i === 0 ? '' : rowspacer;
    rows.push(`<div class="rotation-row">${rowPrefix}${rowImages}</div>`);
  }

  // If no images are selected, clear the overlay and hide it
  if (rows.length === 0) {
    overlay.innerHTML = '';
    overlay.style.visibility = 'hidden';
    toggle.style.visibility = 'hidden';
    return;
  }

  // Update the overlay's innerHTML with the rows
  overlay.innerHTML = rows.join('');
  overlay.style.visibility = 'visible';
  toggle.style.visibility = 'visible';
};
// Add a listener for changes to #abilitiesPerRow
getById('abilitiesPerRow')?.addEventListener('input', () => {
  renderRotationPreview();
});

let detailsAreHidden = false;
const handleToggleDetails = () => {
  const toggleDetailsButton = getById('toggleDetailsButton') as HTMLElement;
  const detailsContainer = getById('rotation-details') as HTMLElement;

  if (!toggleDetailsButton || !detailsContainer) {
    console.error('one or more elements failed to load')
    return;
  };

  if (detailsAreHidden) {
    detailsContainer.style.display = 'block';
    toggleDetailsButton.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
  } 
  else {
    detailsContainer.style.display = 'none';
    toggleDetailsButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
  }

  detailsAreHidden = !detailsAreHidden;
}
getById('toggleDetailsButton')?.addEventListener('click', handleToggleDetails);

let config = {
  appName: 'rotationMaster',
};

function initSettings() {
  if (!localStorage[config.appName]) {
    localStorage.setItem(
      config.appName,
      JSON.stringify({
        activeOverlay: true,
        loopSpeed: 150,
        overlayPosition: { x: 100, y: 100 },
        uiScale: 100,
        updatingOverlayPosition: false,
        lastKnownVersion: '0.0.1' // Initial version
      })
    )
  }
}

async function setOverlayPosition() {
  A1.once('alt1pressed', updateLocation);
  let oldPosition = sauce.getSetting('overlayPosition');
  updatingOverlayPosition = true;
  helperItems.RotationMaster?.classList.toggle(
    'positioning',
    updatingOverlayPosition
  );
  while (updatingOverlayPosition) {
    alt1.setTooltip('Press Alt+1 to save position');
    let abilitiesElement = getById('Abilities');
    sauce.updateSetting('overlayPosition', {
      x: Math.floor(
        A1.getMousePosition()?.x ?? 100 -
        (sauce.getSetting('uiScale') / 100) * (abilitiesElement?.offsetWidth ?? 2 / 2)
      ),
      y: Math.floor(
        A1.getMousePosition()?.y ?? 100 -
          (sauce.getSetting('uiScale') / 100) * (abilitiesElement?.offsetHeight ?? 2 / 2)
      ),
    });
    currentOverlayPosition = sauce.getSetting('overlayPosition');
    alt1.overLayRefreshGroup('group1');
    await sauce.timeout(200);
  }
  alt1.clearTooltip();
}

function updateLocation(e : any) {
  let abilitiesElement = getById('Abilities');
  sauce.updateSetting('overlayPosition', {
    x: Math.floor(
      e.x - (sauce.getSetting('uiScale') / 100) * (abilitiesElement?.offsetWidth ?? 2 / 2)
    ),
    y: Math.floor(
      e.y - (sauce.getSetting('uiScale') / 100) * (abilitiesElement?.offsetHeight ?? 2 / 2)
    ),
  });
  updatingOverlayPosition = false;
  helperItems.RotationMaster?.classList.toggle(
    'positioning',
    updatingOverlayPosition
  );
}

const currentVersion = '2.1.2';
const settingsObject = {
  settingsHeader: sauce.createHeading(
    'h2',
    'RotationMaster - v' + currentVersion
  ),
  beginGeneral: sauce.createHeading('h2', 'Settings'),
  OverlayPositionButton: sauce.createButton(
    'Set Overlay Position',
    setOverlayPosition,
    { classes: ['nisbutton'] }
  ),
  ScaleHeader: sauce.createHeading('h3', 'Scale'),
  UIScale: sauce.createRangeSetting(
    'uiScale',
    'Adjusts the size of the Overlay',
    {
      defaultValue: '100',
      min: 50,
      max: 200,
    }
  ),
  AbilitiesPerRowHeader: sauce.createHeading('h3', 'Abilities Per Row'),
  AbilitiesPerRow: sauce.createNumberSetting(
    'ablitiesPerRow',
    'The number of abilities to show per row in the overlay',
    { defaultValue: 10, min: 1, max: 20 },
    renderRotationPreview
  ),
  OverlayRefreshHeader: sauce.createHeading('h3', 'Refresh Rate'),
  OverlayRefreshRate: sauce.createRangeSetting(
    'overlayRefreshRate',
    'The rate that the overlay should refresh - in milliseconds. Requires reloading to take effect.',
    { defaultValue: '50', min: 20, max: 500, unit: 'ms' }
  ),
}

async function fetchPatchNotes(): Promise<any> {
  const response = await fetch("./patchnotes.json");
  return response.json();
}

// Function to check the version and display patch notes
async function checkAndShowPatchNotes(currentVersion: string) {
  const lastKnownVersion = sauce.getSetting('lastKnownVersion') || '0.0.1'; // Default to an initial version if not set'
  
  if (lastKnownVersion == currentVersion) {
    return;
  }

  const patchNotes = await fetchPatchNotes();


  // Filter patches for versions newer than the last known version
  const newPatches = patchNotes.patches.filter(
    (patch: any) => !lastKnownVersion || patch.version > lastKnownVersion
  );

  newPatches.sort((a: any, b: any) => {
    const versionA = a.version.split('.').map(Number);
    const versionB = b.version.split('.').map(Number);

    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const numA = versionA[i] || 0; // Default to 0 if undefined
      const numB = versionB[i] || 0; // Default to 0 if undefined
      if (numA !== numB) {
        return numB - numA; // Sort descending
      }
    }
    return 0; // Versions are equal
  });



  // Display patch notes
  if (newPatches.length > 0) {
    console.log('New Patch Notes:');
    newPatches.forEach((patch: any) => {
      console.log(`Version: ${patch.version}`);
      console.log(`Description: ${patch.description}`);
      console.log('Changes:');
      patch.changes.forEach((change: string) => console.log(`- ${change}`));
    });

    const patchNotesContainer = getById('patch-notes-container');
    const patchNotesContent = getById('patch-notes-content');
    if (patchNotesContainer && patchNotesContent) {
      // Populate the patch notes content
      patchNotesContent.innerHTML = newPatches
        .map(
          (patch: any) => `
              <h2>Version: ${patch.version}</h2>
              <p>${patch.description}</p>
              <ul>
                ${patch.changes.map((change: string) => `<li>${change}</li>`).join('')}
              </ul>
            `
        )
        .join('<hr style="margin: 20px 0, border: 1px solid #ccc" />');

      // Show the patch notes container
      patchNotesContainer.style.display = 'block';

      // Add event listener to close button
      const closeButton = getById('close-patch-notes');
      closeButton?.addEventListener('click', () => {
        patchNotesContainer.style.display = 'none';
      });
    }
  }

  // Update the last known version in localStorage
  sauce.updateSetting('lastKnownVersion', currentVersion);
  const newVersion = sauce.getSetting('lastKnownVersion');
  console.log(`Updated last known version to: ${newVersion}`);
}

async function ShowAllPatchNotes() {
  const patchNotes = await fetchPatchNotes();
  const patches = patchNotes?.patches || [];

  //sort by version descending
  patches.sort((a: any, b: any) => {
    const versionA = a.version.split('.').map(Number);
    const versionB = b.version.split('.').map(Number);

    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const numA = versionA[i] || 0; // Default to 0 if undefined
      const numB = versionB[i] || 0; // Default to 0 if undefined
      if (numA !== numB) {
        return numB - numA; // Sort descending
      }
    }
    return 0; // Versions are equal
  });
    
  // Display patch notes
  if (patches.length > 0) {
    console.log('New Patch Notes:');
    patches.forEach((patch: any) => {
      console.log(`Version: ${patch.version}`);
      console.log(`Description: ${patch.description}`);
      console.log('Changes:');
      patch.changes.forEach((change: string) => console.log(`- ${change}`));
    });

    const patchNotesContainer = getById('patch-notes-container');
    const patchNotesContent = getById('patch-notes-content');
    if (patchNotesContainer && patchNotesContent) {
      // Populate the patch notes content
      patchNotesContent.innerHTML = patches
        .map(
          (patch: any) => `
              <h2>Version: ${patch.version}</h2>
              <p>${patch.description}</p>
              <ul>
                ${patch.changes.map((change: string) => `<li>${change}</li>`).join('')}
              </ul>
            `
        )
        .join('<hr style="margin: 20px 0, border: 1px solid #ccc" />');

      // Show the patch notes container
      patchNotesContainer.style.display = 'block';

      // Add event listener to close button
      const closeButton = getById('close-patch-notes');
      closeButton?.addEventListener('click', () => {
        patchNotesContainer.style.display = 'none';
      });
    }
  }
}
getById('showPatchNotesButton')?.addEventListener('click', ShowAllPatchNotes);

let helperItems = {
  Output: getById('output'),
  RotationMaster: getById('RotationMaster'),
  Abilities: getById('Abilities'),
}

function startRotationMaster() {
  loadSavedRotations();
  populateSavedRotations();
  renderDropdowns();
  renderRotationPreview();

  if (!window.alt1) {
    helperItems.Output?.insertAdjacentHTML(
      'beforeend',
      `<div>You need to run this page in alt1 to capture the screen</div>`
    );
    return;
  }
  if (!alt1.permissionPixel) {
    helperItems.Output?.insertAdjacentHTML(
      'beforeend',
      `<div><p>Page is not installed as app or capture permission is not enabled</p></div>`
    );
    return;
  }
  if (!alt1.permissionOverlay) {
    helperItems.Output?.insertAdjacentHTML(
      'beforeend',
      `<div><p>Attempted to use Overlay but app overlay permission is not enabled. Please enable "Show Overlay" permission in Alt1 settinsg (wrench icon in corner).</p></div>`
    );
    return;
  }

  checkAndShowPatchNotes(currentVersion);

  const trackedRegion = getById('rotation-preview');
  if (trackedRegion)
    startOverlay(trackedRegion);
}

async function startOverlay(element: HTMLElement) {
  const overlay = element;
  const styles = getComputedStyle(overlay);
  const refreshRate = parseInt(sauce.getSetting('overlayRefreshRate'), 10);
  let overlayPosition;

  const updateOverlay = async () => {
    const uiScale = sauce.getSetting('uiScale');
    const abilitiesPerRow = sauce.getSetting('ablitiesPerRow');
    overlayPosition = currentOverlayPosition;

    try {
      const totalTrackedItems = dropdowns.filter((dropdown) => dropdown.selectedAbility).length;
      const dataUrl = await htmlToImage.toCanvas(overlay, {
        backgroundColor: 'transparent',
        skipFonts: true,
        width: parseInt(styles.minWidth, 10),
        height:
          parseInt(styles.minHeight, 10) +
          Math.floor((totalTrackedItems / abilitiesPerRow) + 1) *
          27 *
          (uiScale / 100),
        quality: 1,
        pixelRatio: uiScale / 100 - 0.00999999999999999999,
        skipAutoScale: true,
      });

      const base64ImageString = dataUrl
        .getContext('2d')
        ?.getImageData(0, 0, dataUrl.width, dataUrl.height);

      if (base64ImageString) {
        alt1.overLaySetGroup('region');
        alt1.overLayFreezeGroup('region');
        alt1.overLayClearGroup('region');
        alt1.overLayImage(
          overlayPosition.x,
          overlayPosition.y,
          A1.encodeImageString(base64ImageString),
          base64ImageString.width,
          refreshRate
        );
        alt1.overLayRefreshGroup('region');
      } else {
        alt1.overLayClearGroup('region');
        alt1.overLayRefreshGroup('region');
      }
    } catch (e) {
      console.error(`html-to-image failed to capture`, e);
    }

    //Schedule the next update
    setTimeout(() => requestAnimationFrame(updateOverlay), refreshRate);
  };

  // Start the first update
  requestAnimationFrame(updateOverlay);
}

// Initialize the app
const App = () => {
  if (window.alt1) {
    //tell alt1 about the app
    alt1.identifyAppUrl('./appconfig.json');

    initSettings();
    let settings = document.querySelector('#Settings .container');
    Object.values(settingsObject).forEach((val) => {
      settings?.before(val);
    });
    var abilitiesPerRowInput = getById('abilitiesPerRow');
    //  add nisinput to ablilitiesPerRowInput
    if (abilitiesPerRowInput) {
      abilitiesPerRowInput.classList.add('nisinput');
    }

    startRotationMaster();
  }
};

// Start the app
App();

