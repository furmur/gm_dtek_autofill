// ==UserScript==
// @name gm_dtek_autofill
// @description dtek-oem.com.ua/ua/shutdowns address autofill
// @author      furmur@pm.me
// @version     0.0.2
// @namespace   https://github.com/furmur
// @include     https://www.dtek-oem.com.ua/ua/shutdowns
// @run-at      document-start
// @grant       none
// ==/UserScript==

//see: https://www.dtek-oem.com.ua/src/js/static/discon-schedule.js

function script_injection_func() {
  window.addEventListener("DOMContentLoaded", function() {
    let city_input = document.getElementById('city')
    let street_input = document.getElementById('street')
    let house_num_input = document.getElementById('house_num')

    //add button for saving city/street/house_num to the local storage
    let container = document.createElement('div'), containerStyle = container.style
    let cssObj = {position: 'absolute', top: '7%', left:'4%', 'z-index': 3}
    Object.keys(cssObj).forEach(key => containerStyle[key] = cssObj[key])
    document.body.appendChild(container)

    function addButton(text, cb) {
      let button = document.createElement('button')
      button.innerHTML = text
      button.onclick = cb
      container.appendChild(button)
      return button
    }

    addButton('save address', function() {
      if(city_input.value &&
         street_input.value &&
         house_num_input.value)
      {
        localStorage.setItem('gm_city', city_input.value)
        localStorage.setItem('gm_street', street_input.value)
        localStorage.setItem('gm_house_num', house_num_input.value)
        alert(`saved\n${city_input.value}\n${street_input.value} ${house_num_input.value}`)
      } else {
        alert('fill all addr fields to save')
      }
    })

    addButton('clear address', function() {
      house_num_input.value = ""
      street_input.value = ""
      city_input.value = ""

      localStorage.removeItem('gm_city')
      localStorage.removeItem('gm_street')
      localStorage.removeItem('gm_house_num')
    })

    //remove all modal stuff
    document.querySelectorAll('.modal__container, .modal__overlay').forEach(function(node) {
      node.remove()
    })

    //load saved addr from the local storage
    let city = localStorage.getItem('gm_city')
    let street = localStorage.getItem('gm_street')
    let house_num = localStorage.getItem('gm_house_num')

    if(!city) {
      //no saved address
      return
    }

    //wait for CSRF meta to be loaded
    let interval = setInterval(function() {
      clearInterval(interval);

      //fill inputs
      city_input.value = city
      street_input.value = street
      house_num_input.value = house_num

      //backup original entities
      let form_back = DisconSchedule.form
      let autocomplete_backup = DisconSchedule.autocomplete

      //override serializeArray() function for DisconSchedule.ajax.formSubmit
      DisconSchedule.form = {}
      DisconSchedule.form.serializeArray = function() {
        return [
          { name: "city", value: city},
          { name: "street", value: street}
        ]
      }

      //override autocomplete() function for DisconSchedule.ajax.formSubmit answer handler
      DisconSchedule.autocomplete = function(inp, data, key_preset) {
        val_val = house_num.toLowerCase()
        let i_index = data.indexOf(house_num.toLowerCase())
        if(i_index) {
          DisconSchedule.alertMessageBlock(key_preset, i_index, false);
        }

        //restore default functionality
        DisconSchedule.form = form_back
        DisconSchedule.autocomplete = autocomplete_backup
      }

      //emulate house number is choosen after the autocomplete
      //see: DisconSchedule.autocomplete: function (inp, data, key_preset)
      DisconSchedule.ajax.formSubmit('getHomeNum')
    }, 1000)
  }, false)
}

//injecting to the DOM
let D = document
let script_node = D.createElement ('script')
script_node.textContent = '(' + script_injection_func.toString() + ')()';
(D.getElementsByTagName ('head')[0] || D.body || D.documentElement).appendChild(script_node)
