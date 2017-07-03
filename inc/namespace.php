<?php

namespace LiveSettings;

/**
 * Register actions and filters.
 */
function bootstrap() {
	add_action( 'admin_head', __NAMESPACE__ . '\\enqueue_script' );
	add_action( 'rest_api_init', __NAMESPACE__ . '\\register_more_settings', 10 );
}

/**
 * Enqueue the Live Settings script.
 */
function enqueue_script() {
	global $parent_file;

	// Only load on options pages.
	if ( $parent_file !== 'options-general.php' ) {
		return;
	}

	wp_enqueue_script(
		'settings-live',
		plugins_url( 'live-settings.js', BASE_PATH ),
		array( 'jquery', 'wp-api', 'underscore' )
	);
	wp_localize_script(
		'settings-live',
		'LiveSettingsData',
		array(
			'map' => get_settings_map(),
		)
	);
}

/**
 * Register settings we need which aren't set in register_initial_settings
 */
function register_more_settings() {
	register_setting( 'general', 'users_can_register', array(
		'show_in_rest' => true,
		'type'         => 'boolean',
		'description'  => __( 'Default post format.' ),
	) );

	register_setting( 'general', 'default_role', array(
		'show_in_rest' => true,
		'type'         => 'string',
		'description'  => __( 'Default post format.' ),
	) );
}

/**
 * Get map from internal name to REST API name.
 *
 * @return array Map from option name to API key.
 */
function get_settings_map() {
	// Some settings are only initialised for the REST API.
	if ( ! did_action( 'rest_api_init' ) ) {
		rest_get_server();
	}

	$settings = get_registered_settings();
	$map = array();
	foreach ( $settings as $key => $options ) {
		if ( empty( $options['show_in_rest'] ) ) {
			// Not available via the API, force it to be skipped.
			$map[ $key ] = false;
			continue;
		}

		if ( ! is_array( $options['show_in_rest'] ) || ! isset( $options['show_in_rest']['name'] ) ) {
			// Enabled, but using defaults.
			continue;
		}

		// Get the API's key.
		$api_key = $options['show_in_rest']['name'];
		if ( $api_key === $key ) {
			// Matches, so no need.
			continue;
		}

		$map[ $key ] = $api_key;
	}

	return $map;
}
