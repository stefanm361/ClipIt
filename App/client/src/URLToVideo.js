import React, {useState, useRef} from 'react';
import {useToggle} from "./useToggle";
import { VideoDisplay } from './VideoDisplay';
import './index.css';

export const URLToVideo = ({proceedWithVideo}) => {
    const [url, setUrl] = useState("");
    const { status: hide, toggleStatus: toggleHide } = useToggle();
    const inputRef = useRef();
  

    function onSubmit(e) {
        e.preventDefault();

        const value = inputRef.current.value;
        const validation = validateYouTubeUrl(value);
        validation === true ? handleSuccess(value) : alert("Invalid URL entered. Please try again");
    }

  function handleSuccess(url) {
    toggleHide();
  }


  function validateYouTubeUrl(url) {
    if (url !== undefined || url !== "") {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        setUrl('https://www.youtube.com/embed/' + match[2])
        return true;
      } else {
        return false;
      }
    }
  }


  function handleBack(){
    setUrl('')
    toggleHide()
  }

  return (
    <div>
      {!hide ? (
        <>
        <form onSubmit={onSubmit} className='url-form'>
          <text className='search-prompt'>Please enter the URL of the video you wish to clip</text>
          <label className='url-label'>
            <input inputMode="numeric" type="text" name="url" id="url" ref={inputRef} className='search-input'/>
            <input type="submit" value="Submit" className='search-button'/>
          </label>      
        </form>
        
        <></>
        </>
      ) : (
        <>
          <VideoDisplay url={url} displayTimes={-1} videoDuration={-1} onBack={handleBack} onProceed={proceedWithVideo}/>
        </>
      )}
    </div>
  );
}


