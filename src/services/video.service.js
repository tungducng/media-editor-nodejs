const path = require('node:path');
const cluster = require('node:cluster');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const util = require('../util');
const DB = require('../DB');
const FF = require('../../lib/FF');
const { pipeline } = require('node:stream/promises');

let jobs;
if (cluster.isPrimary) {
  const JobQueue = require("../../lib/JobQueue");
  jobs = new JobQueue();
}

class VideoService {
	static getVideos = (req) => {
		DB.update();
		const videos = DB.videos.filter((video) => {
			return video.userId === req.userId;
		});

		return { status: 200, videos };
	};

	static getVideoAsset = async (req) => {
		const videoId = req.query.videoId;
		const type = req.query.type;

		const video = this.findVideoById(videoId);

		if (!video) {
			throw new Error('Video not found!');
		}

		let filePath;
		let mimeType;
		let filename;

		switch (type) {
			case 'thumbnail':
				filePath = path.join(__dirname, `../../storage/${videoId}/thumbnail.jpg`);
				mimeType = 'image/jpeg';
				break;
			case 'audio':
				filePath = path.join(__dirname, `../../storage/${videoId}/audio.aac`);
				mimeType = 'audio/aac';
				filename = `${video.name}-audio.aac`;
				break;
			case 'resize':
				const dimensions = req.query.dimensions;
				filePath = path.join(
					__dirname,
					`../../storage/${videoId}/${dimensions}.${video.extension}`
				);
				mimeType = 'video/mp4';
				filename = `${video.name}-${dimensions}.${video.extension}`;
				break;
			case 'original':
				filePath = path.join(
					__dirname,
					`../../storage/${videoId}/original.${video.extension}`
				);
				mimeType = 'video/mp4'; // Not a good practice! Videos are not always MP4
				filename = `${video.name}.${video.extension}`;
				break;
		}

		try {
			const file = await fs.open(filePath, 'r');
			const stat = await file.stat();
			const fileStream = file.createReadStream();

			return { fileStream, mimeType, filename, size: stat.size };
		} catch (e) {
			throw new Error('Server error!');
		}
	};

	static uploadVideo = async (req) => {
		const specifiedFileName = req.headers.filename;
		const extension = path.extname(specifiedFileName).substring(1).toLowerCase();
		const name = path.parse(specifiedFileName).name;
		const videoId = crypto.randomBytes(4).toString('hex');

		const FORMATS_SUPPORTED = ['mov', 'mp4'];

		if (FORMATS_SUPPORTED.indexOf(extension) == -1) {
			throw new Error('Only these formats are allowed: mov, mp4');
		}

		try {
			await fs.mkdir(`./storage/${videoId}`);
			const fullPath = `./storage/${videoId}/original.${extension}`; // the original video path
			const file = await fs.open(fullPath, 'w');
			const fileStream = file.createWriteStream();
			const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`;

			await pipeline(req, fileStream);

			// Make a thumbnail for the video file
			await FF.makeThumbnail(fullPath, thumbnailPath);

			// Get the dimensions
			const dimensions = await FF.getDimensions(fullPath);

			DB.update();
			DB.videos.unshift({
				id: DB.videos.length,
				videoId,
				name,
				extension,
				dimensions,
				userId: req.userId,
				extractedAudio: false,
				resizes: {},
			});
			DB.save();

			return { status: 'success', message: 'The file was uploaded successfully!' };
		} catch (e) {
			// Delete the folder
			util.deleteFolder(`./storage/${videoId}`);
			throw e;
		}
	};

	static extractAudio = async (req) => {
		const videoId = req.query.videoId;

		DB.update();
		const video = DB.videos.find((video) => video.videoId === videoId);

		if (video.extractedAudio) {
			throw new Error('The audio has already been extracted for this video.');
		}

		const originalVideoPath = `./storage/${videoId}/original.${video.extension}`;
		const targetAudioPath = `./storage/${videoId}/audio.aac`;

		try {
			await FF.extractAudio(originalVideoPath, targetAudioPath);

			video.extractedAudio = true;
			DB.save();

			return { status: 'success', message: 'The audio was extracted successfully!' };
		} catch (e) {
			util.deleteFile(targetAudioPath);
			throw e;
		}
	};

    static resizeVideo = async (req) => {
        const videoId = req.body.videoId;
        const width = Number(req.body.width);
        const height = Number(req.body.height);
      
        DB.update();
        const video = DB.videos.find((video) => video.videoId === videoId);
        video.resizes[`${width}x${height}`] = { processing: true };
        DB.save();
      
        if (cluster.isPrimary) {
          jobs.enqueue({
            type: "resize",
            videoId,
            width,
            height,
          });
        } else {
          process.send({
            messageType: "new-resize",
            data: { videoId, width, height },
          });
        }
      
        return { status: "success", message: "The video is now being processed!" };
      };

	// reuse functions from the previous videoService class
	static findVideoById = (videoId) => {
		DB.update();
		return DB.videos.find((video) => video.videoId === videoId);
	};
}

module.exports = VideoService;
