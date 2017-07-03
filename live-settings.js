jQuery(function ($) {
	wp = window.wp || {};

	var DISPLAY_TIME = 2000,
		DEBOUNCE_TIME = 300;

	var LiveSettings = wp.LiveSettings = function ( model ) {
		this.model = model;
		this.model.isNew = function () {
			return false;
		};
		this.queuedUpdates = {};
		this.debouncedSync = _.debounce( this.sync, DEBOUNCE_TIME );
		this.statusElements = {};
	};
	LiveSettings.map = LiveSettingsData.map || {};

	// For multi-selections, only save the text input, not the radios.
	LiveSettings.map.date_format = null;
	LiveSettings.map.date_format_custom = 'date_format';
	LiveSettings.map.time_format = null;
	LiveSettings.map.time_format_custom = 'time_format';

	_.extend( LiveSettings.prototype, {
		watch: function ( $form ) {
			var registered = this.model.args,
				map = LiveSettings.map;

			$('input, textarea, select', $form).each( _.bind( function ( idx, el ) {
				var field = el.name, $input;
				if ( field in map ) {
					field = map[ field ];
				}
				if ( ! field || ! ( field in registered ) ) {
					return;
				}

				$input = $( el );

				el.dataset.apiField = field;
				$input.addClass( 'livesettings-updatable' );

				// Where should we insert? Look for the last thing that's not .description.
				var $status = $( '<span class="livesettings-status"></span>' );
				var $after = $input.parent().children( ':not(.description)' ).last();
				$status.insertAfter( $after );
				this.statusElements[ field ] = $status;
			}, this ) );
			$form.on( 'change input', '.livesettings-updatable', _.bind( function ( e ) {
				var $input = $( e.target ),
					field = $input.data( 'apiField' );

				this.update( field, $input.val() );
			}, this ) );
		},
		update: function ( field, value ) {
			this.queuedUpdates[ field ] = value;
			this.debouncedSync();
		},
		sync: function () {
			var updated = this.queuedUpdates, options;
			this.queuedUpdates = {};

			options = {
				patch: true,
				success: _.bind( function () {
					this.showMessages( 'Saved!', Object.keys( updated ) );
				}, this ),
				error: _.bind( function ( model, response) {
					// Is this a validation error?
					var error = response.responseJSON;
					if ( 'code' in error && error.code === 'rest_invalid_param' ) {
						// Show errors on the fields that failed validation.
						_.each( error.data.params, _.bind( function ( message, key ) {
							this.showMessages( 'Error: ' + message, [ key ] );
						}, this ) );
					}
					console.log( 'errored' );
				}, this ),
			};

			this.model.save( updated, options );
		},
		showMessages: function ( message, fields ) {
			_.each( fields, _.bind( function ( field ) {
				var $status = this.statusElements[ field ];
				var $update = $( '<span><span class="dashicons dashicons-yes"></span> <span class="message"></span></span>' );

				$update.children( '.message' ).text( message );

				// HACK:
				$( '.dashicons', $update ).css({
					'vertical-align': 'middle',
					'color': '#46B450',
				});

				$status.empty().append( $update );

				window.setTimeout( function () {
					$update.fadeOut( function () {
						$update.remove();
					})
				}, DISPLAY_TIME );
			}, this ) );
		},
		showMessage: function () {
			var $el = $( '<div><p /></div>' );
			$el.css({
				background: '#23282d',
				color: '#ccc',
				position: 'fixed',
				bottom: '0.5em',
				right: '0.5em',
				padding: '0 2em',
			});

			$( 'p', $el ).text( 'Saved!' );
			$( 'body' ).append( $el );

			window.setTimeout( function () {
				$el.fadeOut( function () {
					$el.remove();
				});
			}, DISPLAY_TIME );
		}
	});

	function getSettingsModel( endpoint ) {
		var Settings = endpoint.get('models').Settings;
		if ( Settings ) {
			return Settings;
		}

		// wp-api.js misidentifies it as a Collection currently, so we need to
		// collect data and build it manually.
		var SettingsCollection = endpoint.get('collections').Settings;
		var modelRoute = SettingsCollection.prototype.route;
		var routeName = 'settings';
		var modelClassName = 'Settings';
		var models = endpoint.get('models');

		// Build up our new model.
		models[ modelClassName ] = wp.api.WPApiBaseModel.extend( {

			// Function that returns a constructed url based on the id.
			url: function() {
				var url = endpoint.get( 'apiRoot' ) +
					endpoint.get( 'versionString' ) +
					( ( 'me' === routeName ) ? 'users/me' : routeName );

				if ( ! _.isUndefined( this.get( 'id' ) ) ) {
					url +=  '/' + this.get( 'id' );
				}
				return url;
			},

			// Include a reference to the original route object.
			route: modelRoute,

			// Include a reference to the original class name.
			name: modelClassName,

			// Include the array of route methods for easy reference.
			methods: modelRoute.route.methods
		} );
		wp.api.utils.decorateFromRoute(
			modelRoute.route.endpoints,
			models[ modelClassName ],
			endpoint.get( 'versionString' )
		);

		// Push back to the main data...
		endpoint.set( 'models', models );

		// ...and finally return.
		return models[ modelClassName ];
	}

	wp.api.loadPromise.done( function ( endpoint ) {
		endpoint.schemaConstructed.done( function ( endpoint ) {
			var Settings = getSettingsModel( endpoint );

			var watcher = wp.LiveSettings.instance = new LiveSettings( new Settings() );
			watcher.watch( $('.form-table') );
		});
	});
});
