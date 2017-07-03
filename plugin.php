<?php
/**
 * Plugin Name: Live Settings
 * Description: Update your settings, live, and avoid unnecessary page refreshes.
 * Author: WordPress REST API Focus Team
 * Author URI: https://make.wordpress.org/core/components/rest-api/
 * Version: 0.1-dev
 */

namespace LiveSettings;

const BASE_PATH = __FILE__;

require __DIR__ . '/inc/namespace.php';

add_action( 'plugins_loaded', __NAMESPACE__ . '\\bootstrap' );
