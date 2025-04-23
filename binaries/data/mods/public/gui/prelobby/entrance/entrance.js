function init()
{
	return Promise.race([loginButton(), cancelHandler()]);
}

function cancelHandler()
{
	return new Promise(closePageCallback => {
		Engine.GetGUIObjectByName("cancel").onPress = closePageCallback;
	});
}

async function loginButton()
{
	let skipEntrance = Engine.ConfigDB_GetValue("user", "lobby.login");
	while (true)
	{
		if (!skipEntrance)
			await new Promise(resolve => { Engine.GetGUIObjectByName("login").onPress = resolve; });

		const ret = await Engine.OpenChildPage("page_prelobby_login.xml");
		if (ret !== undefined)
			return ret;

		skipEntrance = false;
	}
}

function registerButton()
{
	Engine.OpenChildPage("page_prelobby_register.xml");
}
