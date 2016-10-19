'use strict';

const DOMAIN = window.location.hostname.split(".").slice(-3).join(".");
const MESSAGES_DOMAIN = 'http://data.'+ DOMAIN;
const AUTH_DOMAIN = 'http://auth.'+ DOMAIN;
const REDIRECT_DOMAIN = 'http://static.'+ DOMAIN;

const ELEMS = {
	conversation: document.querySelector('.conversation-container'),
	form: document.querySelector('.conversation-compose'),
	chatStatus: document.querySelector('#chat-status'),
	chatLogin: document.querySelector('#chat-login'),
	phoneButton: document.querySelector('.actions.phone'),
	informationsMenu: document.querySelector('.actions.more')
};

const LOGIN_ELEMS = {
	facebookButton: document.querySelector('.facebook-button'),
	googleButton: document.querySelector('.google-button')
}

function main () {
	let user = initFakeUser();

	// initLogin(ELEMS.phoneButton, AUTH_DOMAIN, REDIRECT_DOMAIN, user);
	if(ELEMS.conversation){
		initConversation(MESSAGES_DOMAIN, user, ELEMS.conversation);
		listenToMessagesReceived(MESSAGES_DOMAIN, user, ELEMS.conversation);
		listenToMessageSubmission(MESSAGES_DOMAIN, ELEMS.form, user, ELEMS.conversation);
		bindInformationsMenu(ELEMS);
	}else {
		listenToFacebookLogin(LOGIN_ELEMS, AUTH_DOMAIN, REDIRECT_DOMAIN);
	}

}

function initLogin (loginElement, authEndpoint, redirectEndpoint, user) {
	let auth = WeDeploy.auth(authEndpoint);
	let provider = new auth.provider.Google();

	provider.setProviderScope('email');
	provider.setRedirectUri(redirectEndpoint);

	loginElement.addEventListener('click', () => {
	auth.signInWithRedirect(provider);
	});


	auth.onSignIn((loginDetails) => {
	let {name} = loginDetails;

	chatLogin.innerHTML = name;
	user.name = name;
	});
}

function bindInformationsMenu(elems){
	let info = elems.informationsMenu;
	info.addEventListener('click', function(){
		info.classList.add('opened');
	});

	elems.conversation.addEventListener('click', function(e) {
		info.classList.remove('opened');
	})
}


	function listenToFacebookLogin(loginElement, authEndpoint, redirectEndpoint){
	console.log('pegou')
	let auth = WeDeploy.auth();
	let provider = new auth.provider.Facebook();
	provider.setProviderScope("email");

	auth.signInWithRedirect();

	auth.onSignIn((user)=>{

	});
}

/**
 * Initializes the user, either from localstorage or by
 * creating it and then storing it on localstorage.
 */
function initFakeUser () {
  if (localStorage.myUser) {
    return JSON.parse(localStorage.myUser);
  }

  let user = {
    "id": faker.random.uuid(),
    "name": faker.name.firstName(),
    "color": 'color-' + Math.floor(Math.random() * 19)
  };

  localStorage.setItem('myUser', JSON.stringify(user));

  return user;
}


/**
 * Initializes the conversation element
 */
function initConversation (messagesEndpoint, user, conversationElement) {
  const BOT_USER = {
    "id": 'TheBot',
    "name": 'TheBot',
    "color": 'color-1'
  };

  WeDeploy.data(messagesEndpoint)
    .limit(100)
    .orderBy('id', 'desc')
    .get("messages")
    .then((result) => {

      ELEMS.chatStatus.innerHTML = 'online';

      result
        .reverse()
        .forEach(appendMessage.bind(null, user, conversationElement));

      appendMessage(user, conversationElement, {
        content: [ 
          "Hey! I'm a TheBot.", 
          "Type `TheBot: command` to use my API.", 
          "Use `help` command to start :D " 
        ].join('<br />'),
        time: 'whatever', 
        author: BOT_USER
      }); 
    });
}


function listenToMessagesReceived (messagesEndpoint, user, conversationElement) {
  WeDeploy.data(messagesEndpoint)
    .limit(1)
    .orderBy('id', 'desc')
    .watch("messages")
    .on('changes', (result) => {
      let data = result.pop();

      if (data.domID) {
        let element = document.getElementById(data.domID);

        if (element) {
          return animateMessage(element);
        } 
      }
      
      appendMessage(user, conversationElement, data);
    });
}


function listenToMessageSubmission(messagesEndpoint, form, user, conversationElement) {
  form.addEventListener('submit', (e) => {
    let {input} = e.target;

    if (input.value) {
      let data = {
        domID: faker.random.uuid(),
        author: {
          id: user.id,
          name: user.name,
          color: user.color
        },
        content: input.value,
        time: moment().format('h:mm A')
      };

      appendMessage(user, conversationElement, data);

      WeDeploy
        .url(messagesEndpoint)
        .path("messages")
        .post(data);
    }

    input.value = '';
    conversationElement.scrollTop = conversationElement.scrollHeight;

    e.preventDefault();
  });
}


/**
 * Appends a message to the conversation element.
 */
function appendMessage(myUser, conversationElement, data) {
	let element = buildMessage(data, myUser);

	element.id = data.domID;
	conversationElement.appendChild(element);
	conversationElement.scrollTop = conversationElement.scrollHeight;
}


/**
 * Generates a message element from the data object
 */
function buildMessage(data, myUser) {
	const color = (data.author.id !== myUser.id) ? data.author.color : '';
	const sender = (data.author.id !== myUser.id) ? 'received' : 'sent';
  const content = data.content.replace(/(?:\r\n|\r|\n)/g, '<br />');

	let element = document.createElement('div');

	element.classList.add('message', sender);
	element.innerHTML = '<span class="user ' + color + '">' + data.author.name + '</span>' +
		'<span class="text">' + content + '</span>' +
		'<span class="metadata">' +
			'<span class="time">' + data.time + '</span>' +
			'<span class="tick tick-animation">' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck" x="2047" y="2061"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#92a58c"/></svg>' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#4fc3f7"/></svg>' +
			'</span>' +
		'</span>';

	return element;
}


function animateMessage(message) {
	let tick = message.querySelector('.tick');
	tick.classList.remove('tick-animation');
}


/**
 * Starts the ticking of the device time,
 * setting the updated time in the screen.
 */
function startDeviceTime () {
  let deviceTime = document.querySelector('.status-bar .time');

  deviceTime.innerHTML = moment().format('h:mm');
  setInterval(() => {
    deviceTime.innerHTML = moment().format('h:mm');
  }, 1000);
}

main();
