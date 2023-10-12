import React, {useState, useEffect, useRef} from 'react';
import { FinalEdits } from './FinalEdits';
import Carousel from 'react-bootstrap/Carousel';

export const ClipEditing = ({finalClips, onBack, url}) => {
    const [confirmSplitscreen, setConfirmSplitscreen] = useState(false)
    const [proceed, setProceed] = useState(false)
    const [splitscreenUrl, setSplitsceenUrl] = useState('')
    const [splitscreenClips, setSplitscreenClips] = useState([])
    const [splitscreenDuration, setSplitscreenDuration] = useState(0)
    const [longestClip, setLongestClip] = useState(0)
    const [downloadComplete, setdownloadComplete] = useState(false)
    const [finalEdits, setFinalEdits] = useState(false)
    const [clipCount, setClipCount] = useState(0)
    const inputRef = useRef();

    useEffect(() => {
      let clipCounter = 1
      setSplitscreenClips(finalClips.map((clip) => {
        if (clip.end - clip.start > longestClip){
          setLongestClip(clip.end - clip.start)
        }
        return {id: clipCounter++, start: 0, end: clip.end - clip.start, clipDuration: Math.ceil(clip.end - clip.start)}
      }))
      setClipCount(clipCounter - 1)
    }, [])

    const handleBack = (e) => {
        e.preventDefault()
        console.log(e.target.id)
        if (e.target.id === "splitscreen"){
            onBack()
        } else if (e.target.id === "splitscreen-proceed"){
            setConfirmSplitscreen(false)
        } else if (e.target.id === "splitscreen-clips"){
          setProceed(false)
        }
      }

    function validateYouTubeUrl(splitscreenUrl) {
        if (splitscreenUrl !== undefined || splitscreenUrl !== "") {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
          const match = splitscreenUrl.match(regExp);
          if (match && match[2].length === 11) {
            setSplitsceenUrl('https://www.youtube.com/embed/' + match[2])
            return true;
          } else {
            return false;
          }
        }
      }

    function onSubmit(e) {
        e.preventDefault();
        const value = inputRef.current.value;
        const validation = validateYouTubeUrl(value);
        validation === true ? handleSuccess(value) : alert("Invalid URL entered. Please try again");
    }

    function handleSuccess(splitscreenUrl) {
        setConfirmSplitscreen(true)
    }

    async function proceedWithVideo(e){
        e.preventDefault()
        const res = await(FetchSplitscreenDuration())
        
        if (res / 1000 >= longestClip){
          setProceed(true)
        }
        else{
          alert(`Error. Please ensure splitscreen video length (${res / 1000}s) is longer than the longest clip (${longestClip}s)`)
        }
    }

    async function FetchSplitscreenDuration(){
      try {
        const res = await (await fetch('http://localhost:5000/get_vid_duration',
        {
          method: 'POST',
          cache: "no-cache",
          headers: {
            'Content-type':'application/json', 
          },
          body: JSON.stringify([-1, splitscreenUrl])
        })).json()
        setSplitscreenDuration(res.data)
        return res.data
      } catch(e) {
        console.log("Error. Please check URL")
      } 
    }

    const onEdit = (id, start, end) => {
      setSplitscreenClips(
        splitscreenClips.map((clip) => {
          if (clip.id !== id) {
            return clip;
          }
          return {
            id: clip.id,
            start: start,
            end: end,
            clipDuration: clip.clipDuration,
          };
        })
      );
    }

    async function downloadClips(url, clips, splitscreenUrl, splitscreenClips){
      try {
          const res = await (await fetch('http://localhost:5000/download_clips',
          {
          method: 'POST',
          cache: "no-cache",
          headers: {
              'Content-type':'application/json', 
          },
          body: JSON.stringify([url, clips, splitscreenUrl, splitscreenClips])
          })).json()
          return res.data && setFinalEdits(true)
      } catch(e) {
          console.log("Error. Please check URL")
      }
  }

    function beginClipEdits(e){
      e.preventDefault()
      setdownloadComplete(true)
      downloadClips(url, finalClips, splitscreenUrl, splitscreenClips)
    }

    return (
        <div>
            {!confirmSplitscreen ? (
                <>
                <form className="url-form" onSubmit={onSubmit}>
                  <text className='search-prompt'>Please enter the URL of the video you wish to use as a splitscreen</text>
                  <label className='url-label'>
                      <input inputMode="numeric" type="text" name="splitscreenUrl" id="splitscreenUrl" ref={inputRef} className='search-input'/>
                      <input type="submit" value="Submit" className='search-button'/>
                  </label>
                </form>
                <button className="back2" title="Back"><img id="splitscreen" onClick = {(e) => handleBack(e)} src="/back.svg" alt="Back button"/></button>
                </>
            ) : (
                <>
                {!proceed ? (
                    <>
                    <h2 className="confirm-split">Confirm Splitscreen Video</h2>
                    <div className='video-display'>
                      <iframe src={splitscreenUrl} title="Youtube Video - Splitscreen" width="560" height="315" allowFullScreen/><br/>
                    </div>
                    <button className="back" title="Back"><img id="splitscreen-proceed" onClick = {(e) => handleBack(e)} src="/back.svg" alt="Back button"/></button>
                    <button className='proceed' title="Proceed" onClick= {(e) => proceedWithVideo(e)}><img id="video-proceed" src="/back.svg" alt="Proceed button"/></button>
                    </>
                ) : (
                    <>
                    {!downloadComplete ? (
                      <>
                      <h2 className="split-header">Please select the times for your splitscreen clips:</h2>
                      <Carousel id="split-carousel" controls={true} interval={null}>
                      {splitscreenClips.map((clip) => {
                        return(
                          <Carousel.Item key={clip.id}>
                            <SplitscreenClip key={clip.id}
                            onEdit={(start, end) => onEdit(clip.id, start, end)}
                            url={splitscreenUrl}
                            videoDuration={splitscreenDuration / 1000}
                            clip={clip}
                            />
                          </Carousel.Item>
                        )
                      })}
                      </Carousel>
                      <div className= "buttons">
                        <button className="back2" title="Back" ><img id="splitscreen-clips" onClick = {(e) => handleBack(e)} src="/back.svg" alt="Back button"/></button>
                        <button className='clip-it' title="Begin clipping" onClick={(e) => beginClipEdits(e)}>Clip it!</button>
                      </div>
                      </>
                    ) : (
                      <>
                      {!finalEdits ? (
                        <>
                        <div className="downloading">
                          <h2>Downloading clips</h2>
                        </div>
                        </>
                      ) : (
                        <>
                        <FinalEdits url={url} finalClips={finalClips} clipCount={clipCount}/>
                        </>
                      )} 
                      </>
                    )}
                    </>
                )}       
                </>
            )}
        </div>
    )
}

const SplitscreenClip = props => {
  function formatTime(time){
    const timeInSec = time / 1000
    if (timeInSec < 3600){
        return new Date(time * 1000).toISOString().substring(14, 19)
    } else {
        return new Date(time * 1000).toISOString().substring(11, 16)
    }
  }

    return (
        <div className="splitscreenClips">
            <h3>Splitscreen for clip {props.clip.id} with duration: {formatTime(props.clip.end - props.clip.start)}</h3>
            <div className="clips-video">
              <iframe src={`${props.url}?start=${Math.floor(props.clip.start)}&end=${Math.ceil(props.clip.end)}&enablejsapi=1`} title="Splitscreen Video" width="560" height="315" allowFullScreen/> 
            </div>
            <div className="edits">
              <EditTimesForm 
                  start={props.clip.start} 
                  end={props.clip.end}
                  videoDuration={props.videoDuration}
                  clipDuration={props.clip.clipDuration}
                  onEdit={props.onEdit}
              />
            </div>
        </div>
    )
}

const EditTimesForm = props => {
    const [start, setStart] = useState(formatTime(props.start))
    const [end, setEnd] = useState(formatTime(props.end))

    function onSubmit(e) {
        e.preventDefault();
        const startSeconds = getSecondsFromHHMMSS(start)
        const endSeconds = getSecondsFromHHMMSS(end)
    
        if (startSeconds >= endSeconds){
          alert("Error. Please ensure that start time is before end time.")
          return
        } else if (endSeconds > props.videoDuration){
          alert("Error. Please ensure that end time does not surpass video length.")
          return
        } else if (endSeconds - startSeconds < props.clipDuration){
          alert(`Error. Please ensure that the splitscreen length is equal to or longer than the clip length.\nCurrent splitscreen length: ${endSeconds - startSeconds}\nTarget length: ${props.clipDuration}`)
          return
        } else {
          props.onEdit(startSeconds, endSeconds)
        }
      }

    const onChange = (e) => {
        e.preventDefault();
        if (e.target.id === "start") {
          setStart(e.target.value);
          setEnd(formatTime(getSecondsFromHHMMSS(e.target.value) + props.clipDuration))
          console.log(getSecondsFromHHMMSS(e.target.value) + props.clipDuration)
        } else {
          setEnd(e.target.value);
          if (getSecondsFromHHMMSS(e.target.value) - props.clipDuration >= 0){
            console.log(getSecondsFromHHMMSS(e.target.value) - props.clipDuration)
            setStart(formatTime(getSecondsFromHHMMSS(e.target.value) - props.clipDuration))
          }
        }
    };

    function onBlur(e) {
        e.preventDefault();
        const value = e.target.value;
        const seconds = Math.max(0, getSecondsFromHHMMSS(value));
    
        const time = toHHMMSS(seconds);
        if (e.target.id === "start") {
          setStart(time);
        } else {
          setEnd(time);
        }
    }
  
    function formatTime(time){
      const timeInSec = time / 1000
      if (timeInSec < 3600){
          return new Date(time * 1000).toISOString().substring(14, 19)
      } else {
          return new Date(time * 1000).toISOString().substring(11, 16)
      }
    }

    const getSecondsFromHHMMSS = (value) => {
        const [str1, str2, str3] = value.split(":");
    
        const val1 = Number(str1);
        const val2 = Number(str2);
        const val3 = Number(str3);
    
        if (!isNaN(val1) && isNaN(val2) && isNaN(val3)) {
          // seconds
          return val1;
        }
    
        if (!isNaN(val1) && !isNaN(val2) && isNaN(val3)) {
          // minutes * 60 + seconds
          return val1 * 60 + val2;
        }
    
        if (!isNaN(val1) && !isNaN(val2) && !isNaN(val3)) {
          // hours * 60 * 60 + minutes * 60 + seconds
          return val1 * 60 * 60 + val2 * 60 + val3;
        }
    
        return 0;
    };

    const toHHMMSS = (secs) => {
        const secNum = parseInt(secs.toString(), 10);
        const hours = Math.floor(secNum / 3600);
        const minutes = Math.floor(secNum / 60) % 60;
        const seconds = secNum % 60;
    
        return [hours, minutes, seconds]
          .map((val) => (val < 10 ? `0${val}` : val))
          .filter((val, index) => val !== "00" || index > 0)
          .join(":")
          .replace(/^0/, "");
    };
  
    return (
      <>
        <form id="clip-times">
            <label>
                Clip Start:
                <input inputMode="numeric" type="text" id="start" value={start} onChange={onChange} onBlur={(e) => onBlur(e)}></input>
            </label>
            <label>
                Clip End:
                <input inputMode="numeric" type="text" id="end" value={end} onChange={onChange} onBlur={(e) => onBlur(e)}></input>
            </label>
        </form>
        <button className="edit-times" form="clip-times" type="submit" onClick={(e) => onSubmit(e)}>Edit Times</button>
      </>
    )
  }