import { html } from "lit-html";
import { toggle } from "../Toggle";

import { savePlanToStorage } from "../../routes";
import { bindAll } from "../../utils";
import { Landmarks } from "../Landmark";
import Tool from "./Tool";
import Parameter from "../Parameter";
import Select from "../Select";

export default class LandmarkTool extends Tool {
    constructor(state) {
        const icon = html`<i class="material-icons">label</i>`;
        super("landmark", "Landmark", icon);

        this.state = state;
        this.renderCallback = state.render;

        bindAll(["updateLandmarkList", "saveFeature", "deleteFeature"],
            this);

        let lm = state.place.landmarks;
        if (!lm.source && !lm.type) {
            // initialize a blank landmarks object
            // we cannot replace the object, which is used to remember landmarks
            lm.type = "geojson";
            lm.data = {"type": "FeatureCollection", "features": []};
        }
        // compatibility with old landmarks
        lm = lm.source || lm;

        // remove landmarks which were being drawn and not saved
        lm.data.features = lm.data.features.filter(f => !f.number_id);

        this.landmarks = new Landmarks(state.map, lm, this.updateLandmarkList);
        this.options = new LandmarkOptions(
            this.landmarks,
            lm.data.features,
            this.saveFeature,
            this.deleteFeature,
            this.renderCallback
        );
    }
    updateLandmarkList(selectLastFeature) {
        savePlanToStorage(this.state.serialize());
        if (selectLastFeature) {
            this.options.handleSelectFeature(-1);
            // handleSelectFeature already calls render
        } else {
            this.renderCallback();
        }
    }
    saveFeature(id) {
        this.landmarks.saveFeature(id);
        savePlanToStorage(this.state.serialize());
        this.renderCallback();
    }
    deleteFeature(id) {
        this.landmarks.deleteFeature(id);
        savePlanToStorage(this.state.serialize());
        this.renderCallback();
    }
    activate() {
        super.activate();
        // enable / disable drawing toolbar
        this.landmarks.handleDrawToggle(true);
        document.querySelector(".mapbox-gl-draw_point").click();
    }
    deactivate() {
        super.deactivate();
        this.landmarks.handleDrawToggle(false);
    }
}

class LandmarkOptions {
    constructor(drawTool, features, saveFeature, deleteFeature, renderCallback) {
        this.drawTool = drawTool;
        this.features = features;
        this.saveFeature = saveFeature;
        this.deleteFeature = deleteFeature;
        this.renderCallback = renderCallback;

        bindAll(["handleSelectFeature", "onSave", "onDelete", "setName", "setDescription"],
            this);

        this.selectFeature = this.features.length ? 0 : null;
        if (this.features.length) {
            this.updateName = this.features[0].properties.name;
            this.updateDescription = this.features[0].properties.short_description || '';
        } else {
            this.updateName = null;
            this.updateDescription = null;
        }
    }
    handleSelectFeature(e) {
        // e can be set to -1 (most recent layer)
        this.selectFeature = (e > -1) ? e : (this.features.length - 1);
        this.renderCallback();
    }
    // setName / setDescription: remember but don't yet save to map and localStorage
    setName(name) {
        this.updateName = name;
        let saveButton = document.getElementById("landmark-save-button")
        saveButton.disabled = false;
        saveButton.innerText = "Save";
    }
    setDescription(description) {
        this.updateDescription = description;
        let saveButton = document.getElementById("landmark-save-button")
        saveButton.disabled = false;
        saveButton.innerText = "Save";
    }
    onSave() {
        // save name, description, and location on map and localStorage
        let updateFeature = this.features[this.selectFeature];
        updateFeature.properties.name = this.updateName;
        updateFeature.properties.short_description = this.updateDescription;
        this.saveFeature(updateFeature.id);
        let saveButton = document.getElementById("landmark-save-button")
        saveButton.disabled = true;
        saveButton.innerText = "Saved";
        document.querySelector(".mapbox-gl-draw_point").click();
    }
    onDelete() {
        // delete currently viewed shape
        let deleteID = this.features[this.selectFeature].id;
        if (this.selectFeature === this.features.length - 1) {
            // adjust index if viewing most recent feature
            this.handleSelectFeature(this.features.length - 2);
        }
        this.deleteFeature(deleteID);
    }
    render() {
        let properties = this.features.map(feature => feature.properties);
        if (this.features.length) {
            if (!this.selectFeature) {
                // when we add our first feature, this selects it
                this.selectFeature = 0;
            }

            this.updateName = this.features[this.selectFeature].properties.name;
            this.updateDescription = this.features[this.selectFeature].properties.short_description || '';
        }

        return html`
    <div class="ui-option">
        <legend class="ui-label ui-label--row">Landmarks</legend>
        ${toggle(
            "Show landmarks",
            this.drawTool.visible,
            this.drawTool.handleToggle
        )}
    </div>
    <ul class="option-list">
        <li class="option-list__item">
            ${properties.length > 1
                ? Parameter({
                      label: "Edit:",
                      element: Select(
                          properties,
                          this.handleSelectFeature,
                          this.selectFeature
                      )
                  })
                : ""}
        </li>
    </ul>

    ${this.features.length ? LandmarkFormTemplate({
        name: this.updateName,
        description: this.updateDescription,
        onSave: this.onSave,
        setName: this.setName,
        setDescription: this.setDescription,
        onDelete: this.onDelete
    }) : "Click on the map with the crosshairs (+) to add a point"}
        `;
    }
}


function LandmarkFormTemplate({
    name,
    description,
    onSave,
    setName,
    setDescription,
    onDelete
}) {
    return html`
        <ul class="option-list">
            <li>
                <label class="ui-label">Name</label>
                <input
                    type="text"
                    name="landmark-name"
                    autocomplete="off" 
                    class="text-input vertical-align"
                    .value="${name}"
                    @input=${e => setName(e.target.value)}
                    @blur=${e => setName(e.target.value)}
                />
                <button
                    class="button vertical-align"
                    @click=${onDelete}
                >
                    <div
                        class="icon"
                        title="delete"
                    >
                        <i class="material-icons">delete</i>
                    </div>
                </button>
            </li>
            <li class="option-list__item">
                <textarea
                    class="text-input text-area short-text-area"
                    name="landmark-desc"
                    autocomplete="off"
                    @input=${e => setDescription(e.target.value)}
                    @blur=${e => setDescription(e.target.value)}
                    .value="${description}"
                ></textarea>
            </li>
            <li class="option-list__item">
                <button
                    id="landmark-save-button"
                    class="button button--submit button--alternate ui-label"
                    @click=${onSave}
                >
                    Save
                </button>
            </li>
        </ul>
    `;
}
