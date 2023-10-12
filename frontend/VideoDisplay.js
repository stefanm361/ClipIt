import React, {useState, useEffect} from 'react';
import Carousel from 'react-bootstrap/Carousel';
import {ClipEditing} from "./ClipEditing";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'


export const VideoDisplay = ({url, displayTimes, videoDuration, onBack, onProceed}) => {
    const [filteredClips, setFilteredClips] = useState([]);
    const [noClips, setNoClips] = useState(true)
    const [restore, setRestore] = useState(false)
    const [isEmptyCheck, setIsEmptyCheck] = useState(false)
    const [finalClips, setFinalClips] = useState([])
    const [proceed, setProceed] = useState(false)

    useEffect(() => {
      if (filteredClips.length === 0){
        setNoClips(true)
      }
    }, [isEmptyCheck])

    useEffect(() => {
        let clipCounter = 1
        if (Array.isArray(displayTimes) && displayTimes.length !== 0){
            setFilteredClips(displayTimes.map((clip) => {
                return {id: clipCounter++, start: clip[0] / 1000, end: clip[1] / 1000}
            }))
            setNoClips(false)
        } else if (Array.isArray(displayTimes) && displayTimes.length === 0){
          setFilteredClips([])
          setNoClips(true)
        }
    }, [restore])

    function removeClip(id, e){
        e.preventDefault()
        setFilteredClips(filteredClips.filter((clip) => clip.id !== id))
        setIsEmptyCheck(!isEmptyCheck)
    }

    function handleRestore(){
        setRestore(!restore)
    }

    function handleProceed(e){
      e.preventDefault()
      if (e.target.id === "video-proceed"){
        onProceed(url)
      } else {
          setFinalClips(filteredClips)
          setProceed(true)
        }     
    }

    const handleBack = (e) => {
      e.preventDefault()
      setNoClips(true)
      onBack()
    }

    const onEdit = (id, start, end) => {
        setFilteredClips(
          filteredClips.map((clip) => {
            if (clip.id !== id) {
              return clip;
            }
            return {
              id: clip.id,
              start: start,
              end: end,
            };
          })
        );
    }

    const addClip = (e) => {
      e.preventDefault()
      if (filteredClips.length === 0){
        setFilteredClips([{id: 1, start: 0, end: 60}])
        setNoClips(false)
      } else {
        const lastClipIndex = filteredClips[filteredClips.length - 1].id
        setFilteredClips([...filteredClips, {id: lastClipIndex + 1, start: 0, end: 60}])
      }
    }

    function backFromProceed(){
      setProceed(false)
    }

    return (
        <div>
          {!proceed ? (
            <>
             {!noClips ? (
              <>
              <Carousel id="clip-carousel" controls={true} interval={null}>
              {filteredClips.map((clip) => {
                return(
                  <Carousel.Item key={clip.id}>
                    <Clip key={clip.id}
                        removeClip={(e) => removeClip(clip.id, e)}
                        onEdit={(start, end) => onEdit(clip.id, start, end)}
                        url={url}
                        videoDuration={videoDuration / 1000}
                        clip={clip}
                    />
                  </Carousel.Item>
                )  
            })}
              </Carousel>
              <div className="add-clip-container">
                <button title="Add clip" className="add-clip" onClick = {(e) => addClip(e)}><img src="/add-button.svg" alt="Add clip button"/></button>
              </div>
              <div className="buttons">
                <button className="back2" title="Back" onClick = {(e) => handleBack(e)}><img src="/back.svg" alt="Back button"/></button>
                <button className="restore" onClick={handleRestore}>Restore Original Clips</button>
                <button className='proceed2' title="Proceed" onClick= {(e) => handleProceed(e)}><img src="/back.svg" alt="Proceed button"/></button>
              </div>
              </>
            ) : (
              <>
              {displayTimes === -1 ? (
                <>
                <h2 className="confirm-video">Confirm Video</h2>
                <div className='video-display'>
                  <iframe src={url} title="Youtube Video" allowFullScreen/><br/>
                </div>
                <button className="back" title="Back" onClick = {(e) => handleBack(e)}><img src="/back.svg" alt="Back button"/></button>
                <button className='proceed' title="Proceed" onClick= {(e) => handleProceed(e)}><img id="video-proceed" src="/back.svg" alt="Proceed button"/></button>
                </>
              ) : (
                <>
                <div className="no-clips">
                <h2>Currently no clips. Please click the + button to create a new clip.</h2><br/>
                <div className="add-clip-container">
                  <button title="Add clip" className="add-clip" onClick = {(e) => addClip(e)}><img src="/add-button.svg" alt="Add clip button"/></button>
                </div>
                {Array.isArray(displayTimes) && displayTimes.length !== 0 && (
                  <button onClick={handleRestore}>Restore Original Clips</button>
                )}<br/>
                </div>
                <button className="back2" title="Back" onClick = {(e) => handleBack(e)}><img src="/back.svg" alt="Back button"/></button>
                </>
              )}
              </>
            )} 
            </>
          ) : (
            <>
            <ClipEditing finalClips={finalClips} url={url} onBack={backFromProceed}/>
            </>
          )}
        </div>
    )
}

const Clip = props => {
    return (
        <div className='clips'>
            <h2>Clip {props.clip.id}</h2>
            <div className="clips-video">
              <iframe src={`${props.url}?start=${Math.floor(props.clip.start)}&end=${Math.ceil(props.clip.end)}&enablejsapi=1`} title="Youtube Video" width="560" height="315" allowFullScreen/> 
            </div>
            <div className="edits">
              <button className='delete' onClick={props.removeClip}>Delete Clip</button>
              <EditTimesForm 
                  start={props.clip.start} 
                  end={props.clip.end}
                  videoDuration={props.videoDuration}
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
        } else if (endSeconds - startSeconds > 300){
          alert(`Error. Please ensure that the clip length is 300s or less.\nCurrent length: ${endSeconds - startSeconds}`)
          return
        } else {
          props.onEdit(startSeconds, endSeconds)
        }
      }

    const onChange = (e) => {
        e.preventDefault();
        if (e.target.id === "start") {
          setStart(e.target.value);
        } else {
          setEnd(e.target.value);
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
