# Live Settings for WordPress

Update your settings, live, and avoid unnecessary page refreshes.

<img src="http://i.imgur.com/9zBqMjw.gif" />

## Installation

1. Clone this repository, or [download as a zip](https://github.com/WP-API/live-settings/archive/master.zip).
2. Install as a plugin and activate.
3. That's it!

## Using in Plugins

Live Settings automatically attaches to all pages under the Settings menu in the admin. This should work automatically on plugin settings pages as well, however you will need to register your settings:

```php
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_settings' );

function register_settings() {
	register_setting( 'optiongroup', 'my_custom_setting', array(
		'type'         => 'boolean',
		'show_in_rest' => true,
	));
}
```

Live Settings will attach to your page and automatically discover the settings input fields that match.
