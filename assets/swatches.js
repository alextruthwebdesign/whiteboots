class Swatches extends HTMLElement {
	constructor() {
		super();

		this.productForm = document.querySelector('form[action="/cart/add"]');
		this.inputs = this.querySelectorAll("[name*='properties']")
		this.options = this.querySelectorAll(".swatch-box")
		this.attributesFields = this.querySelectorAll("select")
		this.allStock = {};
		this.variantKey = {}

		if(this.querySelector('#stockData')) {
			this.allStock = JSON.parse(this.querySelector('#stockData').textContent);
		}

		if(this.inputs) {
			this.inputs = [...this.inputs];
			this.inputs = this.inputs.reverse();
			this.inputs.forEach(input => {
				var inputHidden = document.createElement("input");
				inputHidden.setAttribute("type", "hidden");
				inputHidden.setAttribute("name", input.name);
				inputHidden.setAttribute("data-title", input.dataset.title);
				this.productForm.prepend(inputHidden);
			})
		}

		if(this.options) {
			this.options.forEach(element => {
				element.addEventListener('click', debounce((event) => {
					if(!Array.from(element.classList).includes('out-stock-swatch-color')) {
						this.changeSlideByColor(element)
						this.deleteSelected(element);
						this.onChange(event, element);
						
					}
				}, 100).bind(this))
			})
		}

		if(this.inputs.length) {
			this.inputs.forEach(element => {
				element.addEventListener('change', debounce((event) => {
					// if(!Array.from(element.classList).includes('out-stock-swatch-color')) {
						// this.deleteSelected(element);
						// this.onChangeSelect(event, element);
						this.setVariants(element)
					// }
				}, 100).bind(this))
			})
		}
	}

	changeSlideByColor(element) {
		let variant = element.dataset.variant
		let image = document.querySelector(`[data-image-handle="${variant}"]`);

		if(image) {
			let nr = image.closest('.mcs-item').dataset.item;

			if(MagicScroll) {
				MagicScroll.jump(nr)
			}
		}
	}

	deleteSelected(element) {
		const wrapper = element.closest(".swatches-wrapper");
		const boxes = wrapper.querySelectorAll('.swatch-box');
		if(boxes.length) {
			boxes.forEach(function(box){
				box.classList.remove("swatch-box-selected");
			});   
		}
	}

	setSelect(element) {
		const option = element.closest(".product-attribute");
		const selectLabel = option.querySelector('span.label_select');
		const optionValue = element.dataset.optionValue;
		const optionTitle = element.dataset.title;
		const input = this.productForm.querySelector("[name='properties["+optionTitle+"]']");
		const attribute_select = document.querySelector("select[name='properties["+optionTitle+"]']");
		
		input.value = optionValue;
		attribute_select.value = element.dataset.variant;
		selectLabel.innerHTML = optionValue;
	}

	onChange(event,element) {
		this.setSelect(element)
		this.setVariants();
		this.setSwatch();
		this.setVariantKey(element);

		if(!element.classList.contains('out-stock-swatch-color')) {
			element.classList.add('swatch-box-selected')
		}
	}

	setVariantKey(element) {
		let input;
		let variant = element.dataset.variant
		let attr = element.dataset.attribute_name;
		let position = element.dataset.position;

		this.variantKey[position] = {}
		this.variantKey[position] = variant

		let values = Object.keys(this.variantKey).map(k => {
			return this.variantKey[k]
		})
		
		if(this.productForm.querySelector('input[name="variant_key"]')) { // delete the previous
			this.productForm.querySelector('input[name="variant_key"]').remove()
		}
	
		input = document.createElement("input");
		input.setAttribute('type', 'hidden');
		input.setAttribute('name', 'variant_key');
		input.setAttribute('value', values.join('__'));

		this.productForm.appendChild(input);	
	}

	setSwatch() {
		Array.from(this.attributesFields).map((el) => {
			let current_attr_name       = el.dataset.attribute_name

			for (var i = 0, len = el.options.length; i < len; i++) {
				let option = el.options[i];
				let swatch = document.querySelector('[data-variant="'+option.value+'"][data-attribute_name="'+current_attr_name+'"]')

				console.log('inventory_tracking', inventory_tracking)
				if(swatch && discontinued) {
					if(inventory_tracking == 'AttrRuleExc') { // if product inventory is variant level
						if(option.classList.contains('disabled')) {
							swatch.classList.add('out-stock-swatch-color');
						} else {
							swatch.classList.remove('out-stock-swatch-color');
						}
					}
				}
			}
		})
	}

	getChosenAttributes() {
		var data   = {};
		var count  = 0;
		var chosen = 0;

		this.inputs.map((elem) => {
			var attribute_name = elem.dataset.attribute_name;
			var value          = elem.value || '';

			if ( value.length > 0 ) {
				chosen ++;
			}

			count ++;
			data[ attribute_name ] = value;
		});

		return {
			'count'      : count,
			'chosenCount': chosen,
			'data'       : data
		};
	}

	findMatchingVariations(variations, attributes) {
		var matching = [];
		for ( var i = 0; i < variations.length; i++ ) {
			var variation = variations[i];

			if ( this.isMatch( variation.attributes, attributes ) ) {
				if(variation.active && variation.qty > 0 ) {
					matching.push( variation );
				}
			}
		}
		return matching;
	}

	isMatch( variation_attributes, attributes ) {
		var match = true;
		
		for ( var attr_name in variation_attributes ) {
			if ( variation_attributes.hasOwnProperty( attr_name ) ) {
				var val1 = variation_attributes[ attr_name ];
				var val2 = attributes[ attr_name ];
				if ( val1 !== undefined && val2 !== undefined && val1.length !== 0 && val2.length !== 0 && val1 !== val2 ) {
					match = false;
				}
			}
		}
		return match;
	};

	setVariants() {
		let attributes        = this.getChosenAttributes();
		let currentAttributes = attributes.data;

		function extend(obj1, obj2) {
			var keys = Object.keys(obj2);
			for (var i = 0; i < keys.length; i += 1) {
			  var val = obj2[keys[i]];
			  obj1[keys[i]] = ['string', 'number', 'array', 'boolean'].indexOf(typeof val) === -1 ? extend(obj1[keys[i]] || {}, val) : val;
			}
			return obj1;
		}

		Array.from(this.attributesFields).map((el) => {
			let current_attr_select     = el,
				current_attr_name       = current_attr_select.dataset.attribute_name,
				show_option_none        = 'yes',
				attached_options_count  = 0,
				new_attr_select         = document.createElement( 'select' ),
				selected_attr_val       = current_attr_select.value || '',
				selected_attr_val_valid = true;

			if ( ! current_attr_select.dataset.attribute_html ) {
				var refSelect = current_attr_select.cloneNode(true);

				if(refSelect.options.length) {
					for (let index = 0; index < refSelect.options.length; index++) {
						const option = refSelect.options[index];
						
						option.removeAttribute("attached")
						option.disabled = false;
						option.selected = false;
					}

					current_attr_select.dataset.attribute_html = refSelect.innerHTML
				}
			}

			new_attr_select.innerHTML = current_attr_select.dataset.attribute_html;

			var checkAttributes = extend( {}, currentAttributes );
			
			let variationsData = Object.keys(this.allStock).map((k) => {
				let item = this.allStock[k];
				let attributes = k.split('__')
				item.attributes = {
					variant_leather_color: attributes[0],
					variant_size: attributes[1],
					variant_width: attributes[2],
				}
				return item;
			})

			checkAttributes[ current_attr_name ] = '';
		
			var variations = this.findMatchingVariations( variationsData, checkAttributes );

			// console.log('checkAttributes', checkAttributes)
			// console.log('variations', variations)

			for ( var num in variations ) {
				if ( typeof( variations[ num ] ) !== 'undefined' ) {
					var variationAttributes = variations[ num ].attributes;

					for ( var attr_name in variationAttributes ) {
						if ( variationAttributes.hasOwnProperty( attr_name ) ) {
							var attr_val         = variationAttributes[ attr_name ],
								variation_active = '';

							if ( attr_name === current_attr_name ) {
								
								if ( variations[ num ].active ) {
									variation_active = 'enabled';
								}

								if ( attr_val ) {
									// Decode entities.
									let attr = document.createElement( 'div' );
									attr.innerHTML = attr_val;

									attr_val = attr.innerText;	
									// Attach to matching options by value. This is done to compare
									// TEXT values rather than any HTML entities.
									if (new_attr_select.options.length) {
										for (var k = 0, len = new_attr_select.options.length; k < len; k++) {
											var option_element = new_attr_select.options[k],
												option_value = option_element.value;

											if ( attr_val === option_value ) {
												option_element.classList.add( 'attached' );
												option_element.classList.add( variation_active );
												break;
											}
										}
									}
								} 
								else {
									// Attach all apart from placeholder.
									for (let index = 0; index < new_attr_select.options.length; index++) {
										const element = new_attr_select.options[index];
										
										if(index != 0) {
											element.classList.add('attached')
											element.classList.add(variation_active)
										}
									}
								}
							}
						}
					}
				}
			}

			for (let index = 0; index < new_attr_select.options.length; index++) {
				const el = new_attr_select.options[index];
				
				if(el.classList.contains('attached')) {
					attached_options_count += 1;
				}
			}

			if ( selected_attr_val ) {
				selected_attr_val_valid = false;

				if ( 0 !== attached_options_count ) {
					for (let index = 0; index < new_attr_select.options.length; index++) {
						const el = new_attr_select.options[index];
						var option_value = el.value;

						if (['attached', 'enabled'].some(className => el.classList.contains(className))) {
							if ( selected_attr_val === option_value ) {
								selected_attr_val_valid = true;
								break;
							}
						}
					}
				}
			}

			if ( attached_options_count > 0 && selected_attr_val && selected_attr_val_valid && ( 'no' === show_option_none ) ) {
				new_attr_select.options[0].remove();
			}

			
			for (let index = 0; index < new_attr_select.options.length; index++) {
				const el = new_attr_select.options[index];

				if(!el.classList.contains('attached') && index != 0) {
					el.disabled = true
					el.classList.add('disabled')
				}
			}
		
			current_attr_select.innerHTML = new_attr_select.innerHTML;


			for (let index = 0; index < current_attr_select.options.length; index++) {
				const el = current_attr_select.options[index];

				if(!el.classList.contains('enabled') && index != 0) {
					el.disabled = true
				}
			}

			if ( selected_attr_val ) {
				// If the previously selected value is no longer available, fall back to the placeholder (it's going to be there).
				if ( selected_attr_val_valid ) {
					current_attr_select.value = selected_attr_val;
				} else {
					const e = new Event("change");
					current_attr_select.value = '';
					current_attr_select.dispatchEvent(e);

				}
			} else {
				current_attr_select.value = ''; // No change event to prevent infinite loop.
			}
		})
	}
}

customElements.define('swatches-variants', Swatches);