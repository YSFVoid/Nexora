const { joinVoiceChannel, createAudioPlayer, createAudioResource,
  AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const logger = require('../../utils/logger');

const queues = new Map();

class MusicQueue {
  constructor(guildId, voiceChannel, textChannel) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.tracks = [];
    this.current = null;
    this.player = createAudioPlayer();
    this.connection = null;
    this.volume = 100;
    this.loop = false;

    this.player.on(AudioPlayerStatus.Idle, () => this.processQueue());
    this.player.on('error', (err) => {
      logger.error('Music', `Player error: ${err.message}`);
      this.processQueue();
    });
  }

  connect() {
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
    });
    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  enqueue(track) {
    this.tracks.push(track);
    if (!this.current) this.processQueue();
  }

  async processQueue() {
    if (this.tracks.length === 0) {
      this.current = null;
      setTimeout(() => {
        if (!this.current && this.tracks.length === 0) this.destroy();
      }, 120000);
      return;
    }

    this.current = this.tracks.shift();

    try {
      const stream = await this.current.getStream();
      const resource = createAudioResource(stream, { inlineVolume: true });
      if (resource.volume) resource.volume.setVolume(this.volume / 100);
      this.player.play(resource);

      await this.textChannel.send({
        embeds: [createEmbed({
          color: Colors.PRIMARY,
          description: `🎵 Now playing: **${this.current.title}** (${this.current.duration})`,
          footer: `Requested by ${this.current.requestedBy}`,
        })],
      }).catch(() => {});
    } catch (err) {
      logger.error('Music', `Failed to play track: ${err.message}`);
      await this.textChannel.send({
        embeds: [errorEmbed(`Failed to play: ${this.current.title}`)],
      }).catch(() => {});
      this.processQueue();
    }
  }

  skip() {
    this.player.stop();
  }

  stop() {
    this.tracks = [];
    this.current = null;
    this.player.stop();
  }

  destroy() {
    this.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    queues.delete(this.guildId);
  }
}

function getQueue(guildId) {
  return queues.get(guildId);
}

function createQueue(guildId, voiceChannel, textChannel) {
  const queue = new MusicQueue(guildId, voiceChannel, textChannel);
  queues.set(guildId, queue);
  queue.connect();
  return queue;
}

module.exports = { getQueue, createQueue, queues };
