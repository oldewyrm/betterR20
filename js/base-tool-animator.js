function baseToolAnimator () {
	// TODO each of these should have a function `animate` which accepts three parameters:
	//   token: the token object being animated
	//   alpha: the absolute time since the start of the animation
	//   delta; the time delta from the last time the animate function was run
    //   and returns "true" if the token needs to be saved
	// TODO each of these should have a function `hasRun` which returns true if the animation has run/completed
	//   this can be used to clean up completed animations, removing them from the animation queue
	// TODO each of these should have serialize/deserialize functions
	d20plus.anim = {
		Nop: function () {
			this.animate = function () {
			    return false;
            };

            this.hasRun = () => true;
		},

		Move: function (startTime, duration, x, y, z) {
			this._hasRun = false;

			this._progress = 0; // 0 - 1f

			this.animate = function (token, alpha, delta) {
				if (alpha >= startTime) {
					if (this._progress < (1 - Number.EPSILON)) {
						if (this._progress === 0) delta = alpha - startTime;

						const mProcess = delta / duration;

						// handle movement
						const mvX = mProcess * x;
						const mvY = mProcess * y;

                        token.attributes.left += mvX;
                        token.attributes.top -= mvY;

						if (z != null) {
							const statuses = token.get("statusmarkers").split(",");
							let total = 0;
							let pow = 1;
							let out = "";

							// reverse loop through the fluffy wings, multiplying vals by 1/10/100...
							const len = statuses.length;
							for (let i = len - 1; i >= 0; --i) {
								const [name, val] = statuses[i].split("@");
								if (name === "fluffy-wing") {
									total += pow * Number(val);
									pow = pow * 10;
								} else {
									out += statuses[i] + ",";
								}
							}

							total += mProcess * z;
							const nums = String(total).split("");
							for (let i = 0; i < nums.length; ++i) {
								out += `fluffy-wings@${nums[i]}${i < nums.length - 1 ? "," : ""}`;
							}

							token.set("statusmarkers", out);
						}

						// update progress
						this._progress += mProcess;

						return true;
					} else this._hasRun = true;
				}
				return false;
			};

			this.hasRun = () => this._hasRun;
		},

		Copy: function (startTime, childAnimation = false) {
			this._hasRun = false;

			this.animate = function (token, alpha, delta) {
				if (!this._hasRun && alpha >= startTime) {
					this._hasRun = true;

					// based on "d20.clipboard.doCopy"
					const attrs = {
						top: token.attributes.top,
						left: token.attributes.left
					};

					const modelattrs = {};
					const json = token.toJSON();
					d20.token_editor.tokenkeys.forEach(k => modelattrs[k] = json[k]);

					const cpy = {
						type: token.attributes.type,
						attrs,
						modelattrs,
						oldid: token.id
					};

					// based on "d20.clipboard.doPaste"
					let childToken;
					const page = d20.Campaign.pages.models.find(model => model.thegraphics.models.find(it => it.id === token.id));
					if ("image" === cpy.type) {
						attrs.imgsrc = attrs.src;
						childToken = page.addImage(attrs, true, false, false, false, true);
						if (cpy.modelattrs && cpy.modelattrs.represents) {
							const char = d20.Campaign.characters.get(cpy.modelattrs.represents);

							if (char) {
								const updateBarN = (n) => {
									const prop = `bar${n}_link`;
									if ("" !== cpy.modelattrs[prop] && (-1 !== cpy.modelattrs[prop].indexOf("sheetattr_"))) {
										const l = cpy.modelattrs[prop].split("sheetattr_")[1];
										setTimeout(() => char.updateTokensByName(l), 0.5);
									} else {
										const s = char.attribs.get(cpy.modelattrs[prop]);
										const l = s.get("name");
										setTimeout(() => char.updateTokensByName(l, cpy.modelattrs[prop]), 0.5);
									}
								};
								updateBarN(1);
								updateBarN(2);
								updateBarN(3);
							}
						}

						childToken && childToken.save(cpy.modelattrs);
					}

					if (childToken && childAnimation) {
						const nxt = d20plus.anim.TriggerAnimation(startTime, childAnimation);
						const doSaveChild = nxt.animate(childToken, alpha, delta);
						if (doSaveChild) childToken.save();
					}
				}
				return false;
			};

			this.hasRun = () => this._hasRun;
		},

		Rotate: function (startTime, duration, degrees) {
            this._hasRun = false;

            this._progress = 0; // 0 - 1f

            this.animate = function (token, alpha, delta) {
                if (alpha >= startTime) {
                    if (this._progress < (1 - Number.EPSILON)) {
                        if (this._progress === 0) delta = alpha - startTime;

                        const mProcess = delta / duration;

                        // handle rotation
                        const rot = mProcess * degrees;
						token.attributes.rotation += rot;

                        // update progress
                        this._progress += mProcess;

                        return true;
                    } else this._hasRun = true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

		Flip: function (startTime, isHorizontal, isVertical) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    if (isHorizontal) token.attributes.fliph = !(typeof token.attributes.fliph === "string" ? token.attributes.fliph === "true" : token.attributes.fliph);
                    if (isVertical) token.attributes.flipv = !(typeof token.attributes.flipv === "string" ? token.attributes.flipv === "true" : token.attributes.flipv);

                    return true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

		Scale: function (startTime, duration, scaleFactorX, scaleFactorY) {
            this._hasRun = false;

            this._progress = 0; // 0 - 1f

            this.animate = function (token, alpha, delta) {
                if (alpha >= startTime) {
                    if (this._progress < (1 - Number.EPSILON)) {
                        if (this._progress === 0) delta = alpha - startTime;

                        const mProcess = delta / duration;

                        // handle scaling
                        const mScaleX = mProcess * scaleFactorX;
                        const mScaleY = mProcess * scaleFactorY;

						token.attributes.scaleX = Number(token.attributes.scaleX || 0) + mScaleX;
						token.attributes.scaleY = Number(token.attributes.scaleY || 0) + mScaleY;

                        // update progress
                        this._progress += mProcess;

                        return true;
                    } else this._hasRun = true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

		Layer: function (startTime, layer) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    token.attributes.layer = layer;

					return true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

        // TODO consider making an alternate version which sets a property on the character
        // TODO consider the ability to set properties on _other_ tokens -- might not be performant enough?
		SetProperty: function (startTime, prop, value) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    if (prop === "gmnotes") value = escape(value);
                    else if (prop === "sides") value = value.split("|").map(it => escape(it)).join("|");
					token.attributes[prop] = value;

                    return true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

		Lighting: function (startTime, duration, lightRadius, dimStart, degrees) {
            this._hasRun = false;

            this._progress = 0; // 0 - 1f

            this.animate = function (token, alpha, delta) {
                if (alpha >= startTime) {
                    if (this._progress < (1 - Number.EPSILON)) {
                        if (this._progress === 0) delta = alpha - startTime;

                        const mProcess = delta / duration;

                        // handle lighting changes
                        const mLightRadius = mProcess * lightRadius;
                        token.attributes.light_radius = Number(token.attributes.light_radius || 0) + mLightRadius;

                        if (dimStart != null) {
							const mDimStart = mProcess * dimStart;
							token.attributes.light_dimradius = Number(token.attributes.light_dimradius || 0) + mDimStart;
						}

                        if (degrees != null) {
							const mDegrees = mProcess * degrees;
							token.attributes.light_angle = Number(token.attributes.light_angle || 0) + mDegrees;
                        }

                        // update progress
                        this._progress += mProcess;

                        return true;
                    } else this._hasRun = true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

		TriggerMacro: function (startTime, macroName) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

					const macro = null; // TODO fetch macro

					if (!macro) return;

					// TODO trigger macro
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},

		TriggerAnimation: function (startTime, animationUid) {
            this._hasRun = false;

            this.animate = function (token, alpha, delta) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    const anim = animatorTool.getAnimation(animationUid);

					if (!anim) return; // if it has been deleted/etc

                    return anim.animate(token, alpha, delta);
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		}
	};

	const animatorTool = {
		name: "Token Animator",
		desc: "Manage token animations",
		html: `
			<div id="d20plus-token-animator" title="Token Animator" class="anm__win">
				<p>
					<button class="btn" name="btn-add">Add Animation</button>
					<button class="btn mr-2" name="btn-import">Import Animation</button>
					<button class="btn" name="btn-rescue">Rescue Token</button>
				</p>
				
				<div class="anm__wrp-sel-all">
					<label class="flex-label"><input type="checkbox" title="Select all" name="cb-all" class="mr-2"> <span>Select All</span></label>
					<div>
						<button class="btn" name="btn-export">Export Selected</button>
						<button class="btn btn-danger" name="btn-delete">Delete Selected</button>
					</div>
				</div>
				
				<div id="token-animator-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list" style="max-height: 420px; overflow-y: auto; display: block; margin: 0;"></ul>
				</div>
			</div>
			
			<div id="d20plus-token-animator-rescue" title="Token Rescue" class="anm__win">
				<p>
					<button class="btn" name="btn-refresh">Refresh</button>
				</p>
				
				<p class="anm__wrp-sel-all">
					<label class="flex-label"><input type="checkbox" title="Select all" name="cb-all" class="mr-2"> <span>Select All</span></label> 
					<button class="btn" name="btn-rescue">Rescue Selected</button>
				</p>
				
				<div id="token-animator-rescue-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list" style="max-height: 420px; overflow-y: auto; display: block; margin: 0;"></ul>
				</div>
			</div>
			
			<div id="d20plus-token-animator-editor" title="Animation Editor" class="anm__win flex-col">
				<div class="mb-2 no-shrink split">
					<input name="ipt-name" placeholder="Name">
					
					<div>
						<button class="btn" name="btn-save">Save</button>
						<button class="btn" name="btn-help">View Help</button>
						<button class="btn" name="btn-export-file">Export to File</button>
						<button class="btn" name="btn-validate">Validate</button>
					</div>
				</div>
				<div class="anm-edit__ipt-lines-wrp">
					<textarea name="ipt-lines" placeholder="mv 0 100 50 -50" class="anm-edit__ipt-lines"></textarea>
				</div>
			</div>
		`,
		dialogFn () {
			$("#d20plus-token-animator").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			}).data("initialised", false);

			$("#d20plus-token-animator-rescue").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			});

			$("#d20plus-token-animator-editor").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			});

			// FIXME temp code; remove
			window.addEventListener("keypress", (evt) => {
				if (evt.shiftKey && !evt.ctrlKey) {
					if (evt.key === "G") this.openFn();
				}
			})
		},
		openFn () {
			this.$win = this.$win || $("#d20plus-token-animator");
			if (!this.$win.data("initialised")) this._init();
			this.$win.dialog("open");
		},
		__doSaveState () {
			Campaign.save({
				bR20tool__anim_id: this._animId,
				bR20tool__anim_anims: this._anims,
			});
		},
		_doLoadState () {
			this._animId = Campaign.attributes.bR20tool__anim_id || 1;
			this._anims = Campaign.attributes.bR20tool__anim_anims || {};
		},
		_init () {
			window._B20ANIM = this; // debug use only

			this._doLoadState();
			this._doSaveStateDebounced = MiscUtil.debounce(this.__doSaveState, 100);

			this._$winRescue = $(`#d20plus-token-animator-rescue`);
			this._$winEditor = $(`#d20plus-token-animator-editor`);

			this._initMain();
			this._initRescue();
			this._initEditor();
			this.$win.data("initialised", true);
		},
		_initMain () {
			const $btnAdd = this.$win.find(`[name="btn-add"]`);
			const $btnImport = this.$win.find(`[name="btn-import"]`);
			const $btnRescue = this.$win.find(`[name="btn-rescue"]`);

			const $btnSelExport = this.$win.find(`[name="btn-export"]`);
			const $btnSelDelete = this.$win.find(`[name="btn-delete"]`);

			const $cbAll = this.$win.find(`[name="cb-all"]`);
			this._$list = this.$win.find(`.list`);

			$btnAdd.click(() => this.__addAnim(this.__getNewAnim()));

			$btnImport.click(() => {
				// TODO ensure the name and uid are unique - prompt for rename?
			});

			$btnRescue.click(() => {
				this._$winRescue.dialog("open");
			});

			const getSelButtons = ofClass => {
				return this._animList.items
					.map(it => $(it.elm))
					.filter($it => $it.find(`input`).prop("checked"))
					.map($it => $it.find(`.${ofClass}`));
			};

			$btnSelExport.click(() => {
				// TODO collect all; convert to JSON; download
			});

			$cbAll.click(() => {
				const val = $cbAll.prop("checked");
				this._animList.items.forEach(it => {
					$(it.elm.children[0].children[0]).prop("checked", val);
				})
			});

			$btnSelDelete.click(() => confirm("Are you sure?") && getSelButtons(`.anm__btn-delete`).forEach($btn => $btn.click()));

			Object.values(this._anims).forEach(anim => {
				this._$list.append(this.__getAnimListRow(anim));
			});

			this._animList = new List("token-animator-list-container", {
				valueNames: ["name", "uid"]
			});

		},
		__addAnim (anim) {
			const lastSearch = ListUtil.getSearchTermAndReset(this._animList);
			this._anims[anim.uid] = anim;
			this._$list.append(this.__getAnimListRow(anim));

			this._animList.reIndex();
			if (lastSearch) this._animList.search(lastSearch);
			this._animList.sort("name");

			this._doSaveStateDebounced();
		},
		__getNewAnim () {
			let nxtName = "new_animation";
			let suffix = 1;
			while (Object.values(this._anims).find(it => it.name === nxtName)) nxtName = `new_animation_${suffix++}`;
			return {
				uid: this._animId++,
				name: nxtName,
				lines: []
			}
		},
		__getAnimListRow (anim) {
			const $name = $(`<div class="name readable col-8 clickable" title="Edit Animation">${anim.name}</div>`)
				.click(evt => {
					evt.stopPropagation();
					this.__edit(anim);
				});

			const $btnDuplicate = $(`<div class="btn anm__row-btn pictos mr-2" title="Duplicate">F</div>`)
				.click(evt => {
					evt.stopPropagation();
					const copy = MiscUtil.copy(anim);
					copy.name = `${copy.name}_copy`;
					copy.uid = this._animId++;
					this.__addAnim(copy);
				});

			const $btnExport = $(`<div class="btn anm__row-btn pictos mr-2" title="Export to File">I</div>`)
				.click(evt => {
					evt.stopPropagation();
					// TODO convert to JSON; download (__exportAnim)
				});

			const $btnDelete = $(`<div class="btn anm__row-btn btn-danger pictos anm__btn-delete mr-2" title="Delete">#</div>`)
				.click(evt => {
					evt.stopPropagation();
					delete this._anims[anim.uid];
					this._animList.remove("uid", anim.uid);
					this._doSaveStateDebounced();
				});

			return $$`<label class="import-cb-label anm__row">
				<div class="col-1 anm__row-wrp-cb"><input type="checkbox"></div>
				${$name}
				<div class="anm__row-controls col-3 text-center"">
					${$btnDuplicate}
					${$btnExport}
					${$btnDelete}
				</div>
				<div class="hidden uid">${anim.uid}</div>
			</label>`;
		},
		_initRescue () {
			// TODO a tool for rescuing tokens which have been moved off the map
			//   Should reset to 1.0 scale; reset flipping, place on GM layer?
		},
		_initEditor () {
			this._$ed_iptName = this.$win.find(`[name="ipt-name"]`).disableSpellcheck();
			this._$ed_btnSave = this.$win.find(`[name="btn-save"]`);
			this._$ed_btnHelp = this.$win.find(`[name="btn-help"]`);
			this._$ed_btnExportFile = this.$win.find(`[name="btn-export-file"]`);
			this._$ed_btnValidate = this.$win.find(`[name="btn-validate"]`);
			this._$ed_iptLines = this.$win.find(`[name="ipt-lines"]`);

			this._$ed_btnHelp.click(() => {
				// TODO link to a wiki page
				alert("Coming soon to a Wiki near you");
			});
		},
		__edit (anim) {
			anim.lines = anim.lines || [];

			this._$winEditor.dialog("open");
			const $iptLines = this._$winEditor.find(`[name="ipt-lines"]`);
			$iptLines.val(anim.lines.join("\n"));

			const getValidationMessage = () => {
				// create a fake animation object, and check it for errors
				const toValidate = {
					uid: anim.uid, // pass out UID, so the validator can ignore our old data when checking duplicate names
					name: this._$ed_iptName.val(),
					lines: this._$ed_iptLines.val().split("\n")
				};
				return this.__getValidationMessage(toValidate);
			};

			this._$ed_btnSave.off("click").click(() => {
				const msg = getValidationMessage();
				if (msg) return alert(msg);

				// we passed validation
				anim.name = this._$ed_iptName.val();
				anim.lines = this._$ed_iptLines.val().split("\n");
				this._doSaveStateDebounced();
				alert("Saved!");
			});

			this._$ed_btnExportFile.off("click").click(() => {
				// TODO share logic with "Export to File" list button (__exportAnim)
			});

			this._$ed_btnValidate.off("click").click(() => {
				const msg = getValidationMessage();
				if (msg) return alert(msg);
			});
		},
		/**
		 * Returns `null` if valid, or an error message if invalid.
		 * @private
		 */
		__getValidationMessage (anim) {
			// validate name
			if (!anim.name.length) return "Did not have a name!";
			const illegalNameChars = anim.name.split(/[_0-9a-zA-Z]/g).filter(Boolean);
			if (illegalNameChars.length) return `Illegal characters in name: ${illegalNameChars.map(it => `"${it}"`).join(", ")}`;
			const sameName = Object.values(this._anims).filter(it => it.uid !== anim.uid).find(it => it.name === anim.name);
			if (sameName) return "Name must be unique!";

			// validate lines
			// TODO use __getParsedCommand
		},
		__importAnim () {
			// TODO
		},
		__exportAnim () {
			// TODO
		},
		// command parsing
		__getParsedCommand (line) {
			// TODO return null if can't parse
			// TODO cache these somehow? Prevent re-parsing the animation if it hasn't changed
			line = line.split("/\/\//g")[0]; // handle comments
			const tokens = line.split(/ +/g).filter(Boolean);
			if (!tokens.length) return new d20plus.anim.Nop();

			const op = tokens.shift();
			// TODO
			switch (op) {
				case "mv": {
					if (tokens.length < 4 || tokens.length > 5) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const nDuration = Number(tokens[1]);
					if (isNaN(nDuration)) return null;
					const nX = Number(tokens[2]);
					if (isNaN(nX)) return null;
					const nY = Number(tokens[3]);
					if (isNaN(nY)) return null;
					const nZ = tokens[4] ? Number(tokens[4]) : null;
					if (nZ != null && isNaN(nY)) return null;
					return new d20plus.anim.Move(nStart, nDuration, nX, nY, nZ);
				}
				case "rot": {
					if (tokens.length !== 3) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const nDuration = Number(tokens[1]);
					if (isNaN(nDuration)) return null;
					const nRot = Number(tokens[2]);
					if (isNaN(nRot)) return null;
					return new d20plus.anim.Rotate(nStart, nDuration, nRot);
				}
				case "cp": {
					if (tokens.length < 1 || tokens.length > 2) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const anim = tokens[1] ? Object.values(this._anims).find(it => it.name === tokens[1]) : null;
					return new d20plus.anim.Copy(nStart, anim.name);
				}
				case "flip": {
					if (tokens.length !== 3) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const flipH = tokens[1] === "true" ? true : tokens[1] === "false" ? false : null;
					if (flipH == null) return null;
					const flipV = tokens[2] === "true" ? true : tokens[2] === "false" ? false : null;
					if (flipV == null) return null;
					return new d20plus.anim.Flip(nStart, flipH, flipV);
				}
				case "scale": {
					if (tokens.length !== 4) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const nDuration = Number(tokens[1]);
					if (isNaN(nDuration)) return null;
					const nScaleX = Number(tokens[2]);
					if (isNaN(nScaleX)) return null;
					const nScaleY = Number(tokens[3]);
					if (isNaN(nScaleY)) return null;
					return new d20plus.anim.Scale(nStart, nDuration, nScaleX, nScaleY);
				}
				case "layer": {
					if (tokens.length !== 2) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					if (!d20plus.anim.VALID_LAYER.has(tokens[1])) return null;
					return new d20plus.anim.Layer(nStart, tokens[1]);
				}
				case "light": {
					if (tokens.length < 4 || tokens.length > 5) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const nDuration = Number(tokens[1]);
					if (isNaN(nDuration)) return null;
					const nLightRadius = Number(tokens[2]);
					if (isNaN(nLightRadius)) return null;
					const nDimStart = tokens[3] ? Number(tokens[3]) : null;
					if (nDimStart != null && isNaN(nDimStart)) return null;
					const nDegrees = tokens[4] ? Number(tokens[4]) : null;
					if (nDegrees != null && isNaN(nDegrees)) return null;
					return new d20plus.anim.Lighting(nStart, nDuration, nLightRadius, nDimStart, nDegrees);
				}
				case "prop": {
					// TODO these may be type-sensitive -- pass to JSON.parse?
					if (tokens.length !== 3) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					if (!d20plus.anim.VALID_PROP_TOKEN.has(tokens[1])) return null;
					return new d20plus.anim.SetProperty(nStart, tokens[1], tokens[2]);
				}
				case "macro": {
					if (tokens.length !== 2) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const macro = null; // TODO validate macro
					return new d20plus.anim.TriggerMacro(nStart, macro.name); // TODO pass name? pass ID?
				}
				case "anim": {
					if (tokens.length !== 2) return null;
					const nStart = Number(tokens[0]);
					if (isNaN(nStart)) return null;
					const anim = Object.values(this._anims).find(it => it.name === tokens[1]);
					return new d20plus.anim.TriggerAnimation(nStart, anim.uid);
				}
			}
		},

        getAnimation (uid) {
		    return this._anims[uid];
        },

        getAnimQueue (animation) {
		    // TODO
        }
	};

	d20plus.tool.tools.push(animatorTool);

	function hasAnyKey (object) {
        for (const k in object) {
            if (!object.hasOwnProperty(k)) continue;
            return true;
        }
        return false;
    }

	d20plus.anim.animator = {
       /*
        _tracker: {
            tokenId: {
                token: {...}, // Roll20 token
                active: {
                    // only one instance of an animation can be active on a token at a time
                    animUid: {
                        queue: [...], // returned by getAnimQueue
                        start // start time
                    },
                    ... // other animations
                }
            }
        }
        */
		_tracker: {},
		_restTicks: 1,

		__tickCount: 0,

		onPageChange () {
			// TODO nothing?
		},

		startAnimation (token, animUid) {
		    const anim = animatorTool.getAnimation(animUid);
		    const queue = animatorTool.getAnimQueue(anim);

			this._tracker[token.id] = this._tracker[token.id] || {token, active: {}};
            this._tracker[token.id].active[animUid] = {
                queue,
                start: (new Date).getTime()
            }
		},

		endAnimation (token, animUid) {
		    if (this._tracker[token.id] && this._tracker[token.id].active[animUid]) {
		        delete this._tracker[token.id].active[animUid];

                if (hasAnyKey(this._tracker[token.id].active)) delete this._tracker[token.id];
            }
		},

		setRestTicks (tickRate) {
			this._restTicks = tickRate;
		},

		doTick () {
			if (this._hasAnyActive()) {
				this._doTick();
			} else {
				// sleep for 1.5 seconds
				setTimeout(() => this.doTick(), 1500)
			}
		},

		getSaveableState () {
			// TODO export this._tracker -- remove token objects, replace them with ID strings?
			//   convert animation queue into saveable states
		},

		loadStateFrom () {
			// TODO reload saved state, replacing token ID string with token objects
			//   reload animation queue from saveable states
		},

		_hasAnyActive () {
		    return hasAnyKey(this._tracker);
		},

		_doTick () {
			// higher tick rate = slower
			if (++this.__tickCount === this._restTicks) {
			    const time = (new Date()).getTime();

				for (const tokenId in this._tracker) {
				    if (!this._tracker.hasOwnProperty(tokenId)) continue;
					const tokenMeta = this._tracker[tokenId];

                    let anyModification = false;
                    for (const animUid in tokenMeta.active) {
                        if (!tokenMeta.active.hasOwnProperty(animUid)) continue;
                        const instance = tokenMeta.active[animUid];

						// avoid using fast-loop length optimization, as we'll splice out completed animations
                        for (let i = 0; i < instance.queue.length; ++i) {
                            anyModification = instance.queue[i].animate(
                                tokenMeta.token,
                                tokenMeta.start,
                                tokenMeta.start - time
                            ) || anyModification;

                            if (instance.queue[i].hasRun()) {
                                instance.queue.splice(i, 1);
                                --i;
                            }
                        }

                        // queue empty -> this animation is no longer active
                        if (!instance.queue.length) delete tokenMeta.active[animUid];
                    }

                    // no active animations -> stop tracking this token
                    if (!hasAnyKey(tokenMeta.active)) delete this._tracker[tokenId];

                    // save after applying animations
                    if (anyModification) tokenMeta.token.save();
				}
				this.__tickCount = 0;
			}

			requestAnimationFrame(this.doTick())
		},

		init () {
			setTimeout(() => this.doTick(), 5000)
		}
	};

	// all properties that can be set via the 'prop' command
	d20plus.anim.VALID_PROP_TOKEN = new Set([
		"left",
		"top",
		"width",
		"height",
		"z_index",
		"imgsrc",
		"rotation",
		"type",
		"layer",
		"locked",
		"flipv",
		"fliph",
		"anim_loop",
		"anim_paused_at",
		"anim_autoplay",
		"name",
		"gmnotes", // `escape`d HTML
		"controlledby",
		"represents",
		"bar1_value",
		"bar1_max",
		"bar1_link",
		"bar2_value",
		"bar2_max",
		"bar2_link",
		"bar3_value",
		"bar3_max",
		"bar3_link",
		"aura1_radius",
		"aura1_color",
		"aura1_square",
		"aura2_radius",
		"aura2_color",
		"aura2_square",
		"tint_color",
		"status_dead",
		"statusmarkers",
		"showname",
		"showplayers_name",
		"showplayers_bar1",
		"showplayers_bar2",
		"showplayers_bar3",
		"showplayers_aura1",
		"showplayers_aura2",
		"playersedit_name",
		"playersedit_bar1",
		"playersedit_bar2",
		"playersedit_bar3",
		"playersedit_aura1",
		"playersedit_aura2",
		"light_radius",
		"light_dimradius",
		"light_otherplayers",
		"light_hassight",
		"light_angle",
		"light_losangle",
		"light_multiplier",
		"adv_fow_view_distance",
		"groupwith",
		"sides", // pipe-separated list of `escape`d image URLs
		"currentSide"
	]);

	d20plus.anim.VALID_LAYER = new Set(["map", "objects", "foreground", "gmlayer", "walls", "weather"])
}

SCRIPT_EXTENSIONS.push(baseToolAnimator);
