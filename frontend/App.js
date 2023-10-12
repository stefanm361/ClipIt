import React, {useState, useRef} from 'react'
import {URLToVideo} from './URLToVideo'
import {useToggle} from "./useToggle";
import {VideoDisplay} from "./VideoDisplay";
import { Navbar } from './Navbar';
import './index.css';

function App() {

  const [url, setUrl] = useState('')
  const [clipTimes, setClipTimes] = useState([])
  const { status: hide, toggleStatus: toggleHide } = useToggle()
  const [isLoading, setIsLoading] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [dataFound, setDataFound] = useState(false)
  const inputRef = useRef()

  const proceedWithVideo = (finalUrl) => {
    setUrl(finalUrl)
    FetchClips(finalUrl)
    toggleHide()
  }

  async function FetchVideoDuration(mode, finalUrl){
    try {
      const res = await (await fetch('http://localhost:5000/get_vid_duration',
      {
        method: 'POST',
        cache: "no-cache",
        headers: {
          'Content-type':'application/json', 
        },
        body: JSON.stringify([mode, finalUrl])
      })).json()
      setVideoDuration(res.data)
    } catch(e) {
      console.log("Error. Please check URL")
    }
    console.log(videoDuration)
  }


  async function FetchClips(url){
    setIsLoading(true)
    try {
      const res = await (await fetch('http://localhost:5000/handle_url', {
        method:'POST',
        cache: "no-cache",
        headers: {
          'Content-type':'application/json', 
        },
        body: JSON.stringify(url)
      })).json().then(data => (data.data !== "None") ? (setClipTimes(data.data), FetchVideoDuration(1, url)) : (alert("No clip time data could be found for this video."), FetchVideoDuration(-1, url)))
    } catch(e) {
      console.log("Error. Please check URL")
    } finally {
      setIsLoading(false)
    }
  }

  function handleBack(){
    setUrl('')
    setVideoDuration(0)
    setClipTimes([])
    toggleHide()
  }

  return (
    <div id="bs-override-body">
      <Navbar/>
      {!hide ? (
        <>
        <URLToVideo proceedWithVideo={proceedWithVideo}/>
        </>
      ) : (
        <>
        {isLoading ? 
        <>
        <h1 className='finding-clips'>Finding clips</h1>
        </> :
        <>
          <VideoDisplay url={url} displayTimes={clipTimes} videoDuration={videoDuration} onBack={handleBack}/>
        </>
        }
        </>
      )
    }
    <div className='home-text' id="bs-override-info">
          <h2>Finding and editing clips has never been this easy</h2>
          <p>ClipIt! takes your chosen Youtube video and creates ready to post TikTok or Youtube Shorts clips with a splitscreen and optional subtitles.
            If the data is available, ClipIt! finds the most watched parts of the entered Youtube video and allows you to choose or adjust which of the found
            clips to proceed with. Or you can manually select the clip times if you know what you are looking for!
          </p>  
        </div>
        <div className='heatmap'>
          <h2>How to tell if most watched data is available for your video</h2>
          <img src="/heatmap.PNG" alt="The most watched data bar/heatmap on a Youtube video"/>
          <p>If your chosen video has this chart above the video's progress bar when you hover over it &#40;pictured above&#41;, then ClipIt! will find and provide you with the most replayed clips.</p>
        </div>
        <div className='summary'>
          <h2>How to use ClipIt!</h2>
          <div className='how-tos'>
            <img src="/video_icon.svg" alt="Video Icon"/>
            <div>
              <h3>1&#41; Pick Your Video</h3>
              <p>Enter your chosen video's URL and select clip times manually or use ClipIt!'s provided clips based on the most replayed parts of the video &#40;if data is available&#41;.</p>
            </div>
          </div>
          <div className='how-tos'>
            <img src="/edit_icon.svg" alt="Edit Icon"/>
            <div>
              <h3>2&#41; Edit Your Clips</h3>
              <p>Adjust your clip times, enter your desired splitscreen video's URL and select the times to be used in your clips, select your subtitle format & let ClipIt! do the rest.</p>
            </div>
          </div>
          <div className='how-tos'>
            <img src="/check_icon.svg" alt="Checkmark Icon"/>
            <div>
              <h3>3&#41; Done!</h3>
              <p>After completing your editing selections, just let ClipIt! do the work and your clips will be downloaded and ready to upload!</p>
            </div>
          </div>
        </div>     
    </div>
  )
}

export default App
