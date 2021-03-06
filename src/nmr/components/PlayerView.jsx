import classnames from 'classnames';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import TimeUtil from '../util/TimeUtil';

/* global document $:true */

class PlayerView extends Component {
    constructor(props) {
        super(props);
        this._toggleSound = this._toggleSound.bind(this);
        this._handleProcess = this._handleProcess.bind(this);
        this._handleVolume = this._handleVolume.bind(this);
        this._processControl = this._processControl.bind(this);
        this._volumeControl = this._volumeControl.bind(this);
    }

    state = {
        onPlayTrack: this.props.selectedTrack,
        playState: false,
        duration: '/00:00',
        currentTime: '00:00',
        imgSrc: '',
        artistName: '',
        trackName: '未知',
        readyState: 'false',
        songlist: [],
        lock: null,
        muted: false    //是否静音
    }

    componentDidMount() {
        this.audio = this.refs.audio;
        this.playingBar = this.refs.playingBar;
        this.volumeBar = this.refs.volumeBar;
        this.playStateBtn = this.refs.playStateBtn;
        this.processIcon = this.refs.processIcon;
        this.volumeIcon = this.refs.volumeIcon;
        this.audio.volume = 0.5;
        this.volumeIcon.style.left = '42px';
        this.volumeBar.style.width = '50px';

        this.audio.onended = () => {
            this._nextTrack();
        };

        this.audio.onerror = () => {
            // alert("视频加载出错");
        };

        this.audio.oncanplay = () => {
            this.audio.play();
            this.setState({playState: true});
            this.forceUpdate();
        };

        this.audio.ontimeupdate = () => {
            const offset = Math.round(this.audio.currentTime * 500 / this.audio.duration);
            this.playingBar.style.width = offset + 'px';
            this.processIcon.style.left = (offset - 8) + 'px';
            this.props.handleSongProcessTime(this.audio.currentTime);
            this.setState({currentTime: TimeUtil.formateTime(this.audio.currentTime * 1000)});
            this.forceUpdate();
        };

        this.processIcon.ondragstart = (e) => {
            const parentLeft = e.clientX - this.processIcon.offsetLeft;
            this.processIcon.ondrag = (e1) => {
                if (e1.x === 0 && e1.y === 0) {
                    return;
                }
                const left = e1.clientX - parentLeft;
                this._processControl(left, true);
            };
        };

        this.volumeIcon.ondragstart = (e) => {
            const parentLeft = e.clientX - this.volumeIcon.offsetLeft;
            this.volumeIcon.ondrag = (e1) => {
                if (e1.x === 0 && e1.y === 0) {
                    return;
                }
                const left = e1.clientX - parentLeft;
                this._volumeControl(left, true);
            };
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.selectedTrack !== this.state.onPlayTrack) {
            this._initPlayer();
            this._initSelectedTrack(nextProps.selectedTrack);
        }

        if (nextProps.songlist) {
            this.setState({songlist: nextProps.songlist});
        } else {
            this.setState({songlist: []});
        }

        if (this.state.lock === null) {
            this.setState({lock: nextProps.lock});
        } else if (this.state.lock !== nextProps.lock) {
            this.setState({lock: nextProps.lock});
        }
    }

    handleSonglistOpenChange = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.handleSonglistOpenChange();
    }

    handleLockChange = () => {
        this.props.handleLockChange();
    }


    _prevTrack() {
        const track = this.state.onPlayTrack;
        if (track) {
            const index = this.state.songlist.findIndex(item => track.id === item.id);
            if (index === 0) {
                alert('已到达歌单首部');
            } else if (index > 0) {
                const track = this.state.songlist[index - 1 > 0 ? index - 1 : 0];
                // this.setState({onPlayTrack: track.data});
                this.props.handleSelectionChange(track.data);
            } else {
                alert('歌单已清空');
            }
        }
    }

    _nextTrack() {
        const track = this.state.onPlayTrack;
        if (track) {
            const index = this.state.songlist.findIndex(item => track.id === item.id);
            if (index === this.state.songlist.length) {
                alert('Now it is the lastest music');
            } else if (index >= 0) {
                const track = this.state.songlist[index + 1 > 0 ? index + 1 : 0];
                // this.setState({onPlayTrack: track.data});
                this.props.handleSelectionChange(track.data);
            } else {
                alert('歌单已清空');
            }
        }
    }

    _togglePlay() {
        if (!this.state.readyState) return; //效果后续添加
        this.setState({
            playState: !this.state.playState
        });

        if (this.state.playState) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }

    _initPlayer() {
        this.setState({playState: false});
        this.playingBar.style.width = '0px';
        this.processIcon.style.left = '-8px';
    }

    _initSelectedTrack(track) {
        if (track) {
            let duration = 0;
            if (track.lMusic) {
                duration = track.lMusic.playTime;
            } else {
                duration = track.duration;
            }
            this.setState({
                onPlayTrack: track,
                playState: true,
                duration: '/' + TimeUtil.formateTime(duration),
                currentTime: '00:00',
                imgSrc: track.album.blurPicUrl,
                artistName: track.artists.map(artist => artist.name).join(','),
                trackName: track.name,
                mp3Url: track.mp3Url
            });
        } else {
            this.setState({
                onPlayTrack: null,
                playState: false,
                duration: '/00:00',
                currentTime: '00:00',
                imgSrc: '',
                artistName: '',
                trackName: '未知',
                mp3Url: ''
            });
        }
    }

    //歌曲进度控制，realSet为true时真实设置歌曲进度
    _processControl(offsetLeft, realSet = false) {
        if (!this.state.playState) {
            return;
        }
        let left = offsetLeft;
        let width = 0;

        if (left < 0) {
            left = 0;
        } else if (left > 492) {
            left = 492;
            width = 500;
        } else {
            width = left + 16;
        }

        this.processIcon.style.left = left + 'px';
        this.playingBar.style.width = width + 'px';

        if (realSet) {
            const currentTime = (Math.round(this.audio.duration * width / 500));
            this.audio.currentTime = currentTime;
        }
    }

    //歌曲声音控制，realSet为true时真实设置为歌曲声音
    _volumeControl(offsetLeft, realSet = false) {
        let left = offsetLeft;
        let width = 0;
        if (left < 0) {
            left = 0;
        } else if (left > 92) {
            left = 92;
            width = 100;
        } else {
            width = left + 8;
        }
        this.volumeIcon.style.left = left + 'px';
        this.volumeBar.style.width = width + 'px';

        if (realSet) {
            const volume = width / 100;
            this.audio.volume = volume;
        }
    }

    //开关音乐声音
    _toggleSound() {
        this.setState({
            muted: !this.state.muted
        });
    }

    //进度条点击事件监听器
    _handleProcess(e) {
        const processLeft = $('.track-process').offset().left;
        const left = e.clientX - processLeft - 16;
        this._processControl(left, true);
    }

    //声音条点击事件监听器
    _handleVolume(e) {
        const volumeLeft = $('.volume-process').offset().left;
        const left = e.clientX - volumeLeft - 8;
        this._volumeControl(left, true);
    }

    render() {
        return (<div className={this.props.className}>
            <div className="track-btns">
                <span className="prev iconfont icon-previous" onClick={this._prevTrack.bind(this)} />
                <span ref="playStateBtn"
                    className={`play iconfont ${this.state.playState ? 'icon-pause' : 'icon-play'}`}
                    onClick={this._togglePlay.bind(this)}
                />
                <span className="next iconfont icon-next" onClick={this._nextTrack.bind(this)} />
            </div>
            <div className="track-icon"><img src={this.state.imgSrc}/></div>
            <div className="track-process">
                <div className="head">
                    <a className="track-name">{ this.state.trackName }</a>
                    <a className="track-artist">{ this.state.artistName }</a>
                </div>
                <div className="foot">
                    <div className="track-process" onClick={this._handleProcess.bind(this)}>
                        <div ref="playingBar" className="playingBar" />
                        <span ref="processIcon" className="point iconfont icon-bar" draggable="true" />
                    </div>
                    <div className="track-time">{ this.state.currentTime + this.state.duration }</div>
                </div>
            </div>
            <div className="track-setting">
                <a className={`track-volume iconfont ${this.state.muted ? 'icon-soundminus' : 'icon-soundplus'}`}
                    onClick={this._toggleSound.bind(this)}
                />
                <div className="volume-process" onClick={this._handleVolume.bind(this)}>
                    <div ref="volumeBar" className="volumeBar" />
                    <span ref="volumeIcon" className="point iconfont icon-bar" draggable="true" />
                </div>
            </div>
            <div className="song-list">
                <a className="songlist-icon iconfont icon-songlist" onClick={this.handleSonglistOpenChange} />
                <a className={classnames('player-lock-icon', 'iconfont', (this.state.lock ? 'icon-lock' : 'icon-unlock'))} onClick={this.handleLockChange} />
            </div>
            <audio
                ref="audio"
                className="music-player"
                src={this.state.mp3Url} draggable="true" controls="controls"
                muted={this.state.muted}
            />
        </div>);
    }
}


PlayerView.propTypes = {
    className: PropTypes.string,
    lock: PropTypes.bool.isRequired,
    selectedTrack: PropTypes.object,
    songlist: PropTypes.array,
    handleSelectionChange: PropTypes.func.isRequired,
    handleSonglistOpenChange: PropTypes.func.isRequired,
    handleSongProcessTime: PropTypes.func.isRequired,
    handleLockChange: PropTypes.func.isRequired,
};

PlayerView.defaultProps = {
    className: '',
    lock: null,
    selectedTrack: null,
    songlist: [],
    handleSelectionChange: null,
    handleSonglistOpenChange: null,
    handleSongProcessTime: null,
    handleLockChange: null,
};

export default PlayerView;
